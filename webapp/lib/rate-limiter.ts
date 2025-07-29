import { logger } from "@/lib/logger";
import { Redis } from "ioredis";
import { NextRequest } from "next/server";

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipIf?: (req: NextRequest) => boolean; // Skip rate limiting condition
  keyGenerator?: (req: NextRequest) => string | null; // Custom key generation
}

export interface RateLimitResult {
  success: boolean;
  count: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// Redis connection singleton
let redis: Redis | null = null;

function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || "redis://localhost";
    const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);
    const redisUsername = process.env.REDIS_USERNAME;
    const redisPassword = process.env.REDIS_PASSWORD;

    redis = new Redis(redisPort, redisUrl, {
      username: redisUsername,
      password: redisPassword,
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return redis;
}

// Default configurations for different use cases. limits are per user or per ip
export const rateLimitConfigs = {
  // Strict rate limiting for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },
  // Lenient rate limiting for general endpoints
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
  // Strict rate limiting for resource-intensive operations
  intensive: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10, // 10 requests per 5 minutes
  },
} as const;

export class RateLimiter {
  private redis: Redis;
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.redis = getRedisClient();
    this.config = {
      skipIf: () => false,
      keyGenerator: (req) => this.getClientIdentifier(req),
      ...config,
    };
  }

  private getClientIdentifier(req: NextRequest): string | null {
    // Try to get real IP from headers (for proxies/CDNs)

    const ip = this.getClientIP(req);

    if (!ip) {
      logger.rateLimit("error", "Failed to get client IP for rate limiting", {
        metadata: { headers: Object.fromEntries(req.headers.entries()) },
      });
      throw new Error("Redis rate limiting failed");
    }

    // Combine IP with user agent for better uniqueness
    const userAgent = req.headers.get("user-agent") || "unknown";
    const userAgentHash = Buffer.from(userAgent).toString("base64").slice(0, 16);

    return `${ip}:${userAgentHash}`;
  }

  public getClientIP(req: NextRequest): string | null {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIP = req.headers.get("x-real-ip");
    return realIP || forwardedFor?.split(",")[0] || null;
  }

  // TODO: add special rate limiting for authenticated users; limiting not dependent upon ip
  async check(req: NextRequest): Promise<RateLimitResult> {
    // Skip rate limiting if condition is met
    if (this.config.skipIf(req)) {
      return {
        success: true,
        count: 0,
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs,
      };
    }

    const key = `rate_limit:${this.config.keyGenerator(req)}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Use Redis sliding window algorithm
    const pipeline = this.redis.pipeline();

    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Count current requests in window
    pipeline.zcard(key);

    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);

    // Set expiration
    pipeline.expire(key, Math.ceil(this.config.windowMs / 1000));

    const results = await pipeline.exec();

    if (!results || results.some(([err]) => err)) {
      logger.rateLimit("error", "Redis pipeline execution failed", {
        metadata: { key, errors: results?.filter(([err]) => err).map(([err]) => err?.message) },
      });
      throw new Error("Redis rate limiting failed");
    }

    const count = (results[1][1] as number) + 1; // +1 for the request we just added
    const remaining = Math.max(0, this.config.maxRequests - count);
    const success = count <= this.config.maxRequests;
    const resetTime = now + this.config.windowMs;

    const result: RateLimitResult = {
      success,
      count,
      remaining,
      resetTime,
    };

    if (!success) {
      result.retryAfter = Math.ceil(this.config.windowMs / 1000);
      const clientIP = this.getClientIP(req);
      logger.rateLimit("warn", "Rate limit exceeded", {
        metadata: {
          key: key.replace("rate_limit:", ""),
          count,
          maxRequests: this.config.maxRequests,
          windowMs: this.config.windowMs,
          retryAfter: result.retryAfter,
          clientIP,
        },
      });
    }

    return result;
  }

  async reset(req: NextRequest): Promise<void> {
    const key = `rate_limit:${this.config.keyGenerator(req)}`;
    await this.redis.del(key);
  }

  async getStats(req: NextRequest): Promise<{ count: number; resetTime: number }> {
    const key = `rate_limit:${this.config.keyGenerator(req)}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Clean up expired entries and get count
    await this.redis.zremrangebyscore(key, 0, windowStart);
    const count = await this.redis.zcard(key);

    return {
      count,
      resetTime: now + this.config.windowMs,
    };
  }
}

// Helper function to create rate limiter with preset config
export function createRateLimiter(
  preset: keyof typeof rateLimitConfigs,
  overrides?: Partial<RateLimitConfig>
): RateLimiter {
  const config = { ...rateLimitConfigs[preset], ...overrides };
  return new RateLimiter(config);
}

// Utility function to add rate limit headers to response
export function addRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult,
  limit?: number
): void {
  const limitValue = limit || 100;
  headers.set("X-RateLimit-Limit", limitValue.toString());
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", Math.ceil(result.resetTime / 1000).toString());

  if (result.retryAfter) {
    headers.set("Retry-After", result.retryAfter.toString());
  }

  logger.rateLimit("debug", "Added rate limit headers to response", {
    metadata: {
      limit: limitValue,
      remaining: result.remaining,
      success: result.success,
    },
  });
}

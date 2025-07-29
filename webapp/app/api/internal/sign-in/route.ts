import { createNewUser, getUser } from "@/lib/auth/user";
import { logger } from "@/lib/logger";
import { addRateLimitHeaders, createRateLimiter } from "@/lib/rate-limiter";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Single rate limiter instance for this route (strict auth limits)
const rateLimiter = createRateLimiter("auth");

export async function POST(request: NextRequest) {
  // Apply strict rate limiting for authentication operations
  try {
    const rateResult = await rateLimiter.check(request);

    if (!rateResult.success) {
      const clientIP = rateLimiter.getClientIP(request);
      logger.rateLimit("warn", "Authentication rate limit exceeded", {
        metadata: {
          clientIP,
          retryAfter: rateResult.retryAfter,
          count: rateResult.count,
        },
      });
      const response = NextResponse.json(
        {
          error: "Too many authentication attempts. Please try again in 15 minutes.",
          retryAfter: rateResult.retryAfter,
        },
        { status: 429 }
      );
      addRateLimitHeaders(response.headers, rateResult, 5);
      return response;
    }
  } catch (error) {
    logger.rateLimit(
      "error",
      `Rate limiting error in sign-in route by ${rateLimiter.getClientIP(request)}`,
      {
        metadata: { error: error instanceof Error ? error.message : "Unknown error" },
      }
    );
    return NextResponse.json({ error: "Issue with our rate limiting service" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { profile, provider } = body;

    if (!profile || !provider) {
      logger.auth("warn", "Sign-in request missing profile or provider", {
        metadata: { hasProfile: !!profile, hasProvider: !!provider },
      });
      return NextResponse.json({ error: "The profile and provider are required" }, { status: 400 });
    }

    if (!["google", "twitter"].includes(provider)) {
      logger.auth("warn", "Invalid provider in sign-in request", {
        metadata: { provider },
      });
      return NextResponse.json({ error: "Invalid provider value." }, { status: 400 });
    }

    const user = await getUser(profile, provider);

    if (!user) {
      const { userId } = await createNewUser(profile, provider);
      logger.auth("info", "Created new user during sign-in", {
        userId: userId,
        metadata: { provider },
      });
    } else {
      logger.auth("info", "Retrieved existing user during sign-in", {
        userId: user.id,
        metadata: { provider },
      });
    }

    const response = NextResponse.json(
      {
        user: user,
      },
      { status: 200 }
    );

    // Add rate limit headers to successful responses
    try {
      const stats = await rateLimiter.getStats(request);
      const remaining = Math.max(0, 5 - stats.count);
      addRateLimitHeaders(
        response.headers,
        {
          success: true,
          count: stats.count,
          remaining,
          resetTime: stats.resetTime,
        },
        5
      );
    } catch (error) {
      // Continue without headers if there's an error
      logger.auth("warn", "Issue adding rate limiter headers", {
        metadata: { error: error instanceof Error ? error.message : "Unknown error" },
      });
    }

    return response;
  } catch (error) {
    logger.auth("error", "Sign-in API error", {
      metadata: { error: error instanceof Error ? error.message : "Unknown error" },
    });
    return NextResponse.json({ error: error }, { status: 500 });
  }
}

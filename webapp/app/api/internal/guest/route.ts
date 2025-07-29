import { createGuestUser } from "@/db/user";
import { logger } from "@/lib/logger";
import { addRateLimitHeaders, createRateLimiter } from "@/lib/rate-limiter";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Single rate limiter instance for this route
const rateLimiter = createRateLimiter("auth");

export async function GET(req: NextRequest) {
  // Apply rate limiting for API operations
  try {
    const rateResult = await rateLimiter.check(req);

    if (!rateResult.success) {
      const clientIP = rateLimiter.getClientIP(req);
      logger.rateLimit("warn", "Guest creation rate limit exceeded", {
        metadata: {
          clientIP,
          retryAfter: rateResult.retryAfter,
          count: rateResult.count,
        },
      });
      const response = NextResponse.json(
        {
          error: "Too many guest creation requests. Please try again later.",
          retryAfter: rateResult.retryAfter,
        },
        { status: 429 }
      );
      addRateLimitHeaders(response.headers, rateResult, 60);
      return response;
    }
  } catch (error) {
    logger.rateLimit(
      "error",
      `Rate limiting error in guest route by ${rateLimiter.getClientIP(req)}`,
      {
        metadata: { error: error instanceof Error ? error.message : "Unknown error" },
      }
    );
    return new NextResponse("Issue with our rate limiting service", { status: 500 });
  }

  try {
    const guestId = await createGuestUser();

    logger.auth("info", "Created new guest user", {
      userId: guestId,
    });

    const response = NextResponse.json(
      {
        guestId: guestId,
      },
      { status: 200 }
    );

    // Add rate limit headers to successful responses
    try {
      const stats = await rateLimiter.getStats(req);
      const remaining = Math.max(0, 60 - stats.count);
      addRateLimitHeaders(
        response.headers,
        {
          success: true,
          count: stats.count,
          remaining,
          resetTime: stats.resetTime,
        },
        60
      );
    } catch (error) {
      // Continue without headers if there's an error
      logger.rateLimit("warn", "Issue adding rate limiting headers", {
        metadata: { error: error instanceof Error ? error.message : "Unknown error" },
      });
    }

    return response;
  } catch (error) {
    logger.auth("error", "Guest creation API error", {
      metadata: { error: error instanceof Error ? error.message : "Unknown error" },
    });
    return NextResponse.json({ error: "Issue with guest identification." }, { status: 500 });
  }
}

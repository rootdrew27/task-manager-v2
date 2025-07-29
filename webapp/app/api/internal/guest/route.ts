import { createGuestUser } from "@/db/user";
import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter, addRateLimitHeaders } from "@/lib/rate-limiter";


export const runtime = "nodejs";

// Single rate limiter instance for this route
const rateLimiter = createRateLimiter('auth');

export async function GET(req: NextRequest) {
  // Apply rate limiting for API operations
  try {
    const rateResult = await rateLimiter.check(req);

    if (!rateResult.success) {
      const response = NextResponse.json(
        {
          error: 'Too many guest creation requests. Please try again later.',
          retryAfter: rateResult.retryAfter,
        },
        { status: 429 }
      );
      addRateLimitHeaders(response.headers, rateResult, 60);
      return response;
    }
  } catch (error) {
    return new NextResponse("Issue with our rate limiting service", { status: 500 });
  }

  try {
    const guestId = await createGuestUser();

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
      addRateLimitHeaders(response.headers, {
        success: true,
        count: stats.count,
        remaining,
        resetTime: stats.resetTime,
      }, 60);
    } catch (error) {
      // Continue without headers if there's an error
      console.error(error)
    }

    return response;

  } catch (error) {
    return NextResponse.json({ error: "Issue with guest identification." }, { status: 500 });
  }
}

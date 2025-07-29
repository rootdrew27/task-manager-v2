import { createNewUser, getUser } from "@/lib/auth/user";
import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter, addRateLimitHeaders } from "@/lib/rate-limiter";

export const runtime = "nodejs";

// Single rate limiter instance for this route (strict auth limits)
const rateLimiter = createRateLimiter('auth');

export async function POST(request: NextRequest){
  // Apply strict rate limiting for authentication operations
  try {
    const rateResult = await rateLimiter.check(request);
    
    if (!rateResult.success) {
      const response = NextResponse.json(
        {
          error: 'Too many authentication attempts. Please try again in 15 minutes.',
          retryAfter: rateResult.retryAfter,
        },
        { status: 429 }
      );
      addRateLimitHeaders(response.headers, rateResult, 5);
      return response;
    }
  } catch (error) {
    console.error(`Rate limiting error in sign-in route by ${rateLimiter.getClientIP(request)}. Error: `, error)
    return NextResponse.json({ error: "Issue with our rate limiting service" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { profile, provider } = body;

    if (!profile || !provider) {
      return NextResponse.json({ error: "The profile and provider are required" }, { status: 400 });
    }

    if (!["google", "twitter"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider value." }, { status: 400 });
    }

    let user;

    const result = await getUser(profile, provider);

    if (!result) {
      user = await createNewUser(profile, provider);
    } else {
      user = result;
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
      addRateLimitHeaders(response.headers, {
        success: true,
        count: stats.count,
        remaining,
        resetTime: stats.resetTime,
      }, 5);
    } catch (error) {
      // Continue without headers if there's an error
      console.error(error)
    }

    return response;
  } catch (error) {
    console.error("Sign-in API error:", error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}

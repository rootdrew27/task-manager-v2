import { logger } from "@/lib/logger";
import { addRateLimitHeaders, createRateLimiter } from "@/lib/rate-limiter";
import { AccessToken, AccessTokenOptions, VideoGrant } from "livekit-server-sdk";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

const AUTH_SECRET = process.env.AUTH_SECRET;

// Single rate limiter instance for this route
const rateLimiter = createRateLimiter("intensive");

// don't cache the results
export const revalidate = 0;

export type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantIdentity: string;
  participantToken: string;
};

export async function GET(req: NextRequest) {
  // Apply rate limiting for intensive operations (LiveKit connections)
  try {
    const rateResult = await rateLimiter.check(req);

    if (!rateResult.success) {
      const clientIP = rateLimiter.getClientIP(req);
      logger.rateLimit("warn", "LiveKit connection rate limit exceeded", {
        metadata: {
          clientIP,
          retryAfter: rateResult.retryAfter,
          count: rateResult.count,
        },
      });
      const response = NextResponse.json(
        {
          error: "Too many connection requests. Please try again in a few minutes.",
          retryAfter: rateResult.retryAfter,
        },
        { status: 429 }
      );
      addRateLimitHeaders(response.headers, rateResult, 10);
      return response;
    }
  } catch (error) {
    logger.rateLimit(
      "error",
      `Rate limiting error in LiveKit connection route by ${rateLimiter.getClientIP(req)}`,
      {
        metadata: { error: error instanceof Error ? error.message : "Unknown error" },
      }
    );
    return new NextResponse("Issue with our rate limiting service", { status: 500 });
  }

  try {
    if (LIVEKIT_URL === undefined) {
      throw new Error("LIVEKIT_URL is not defined");
    }
    if (API_KEY === undefined) {
      throw new Error("LIVEKIT_API_KEY is not defined");
    }
    if (API_SECRET === undefined) {
      throw new Error("LIVEKIT_API_SECRET is not defined");
    }

    const authToken = await getToken({
      req: { headers: { cookie: req.cookies.toString() } },
      secret: AUTH_SECRET,
    });

    let id;
    if (!authToken) {
      id = req.cookies.get("guest_id")?.value;
    } else {
      id = authToken.id;
    }

    // Generate participant token
    const participantIdentity = id!;
    const roomName = `task_management_room_${uuidv4()}`;
    const participantToken = await createParticipantToken(
      { identity: participantIdentity },
      roomName
    );

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken: participantToken,
      participantIdentity: participantIdentity,
    };

    logger.livekit("info", "Successfully created LiveKit connection details", {
      userId: id,
      metadata: { roomName, serverUrl: data.serverUrl },
    });
    const response = NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });

    // Add rate limit headers to successful responses
    try {
      const stats = await rateLimiter.getStats(req);
      const remaining = Math.max(0, 10 - stats.count);
      addRateLimitHeaders(
        response.headers,
        {
          success: true,
          count: stats.count,
          remaining,
          resetTime: stats.resetTime,
        },
        10
      );
    } catch (error) {
      // Continue without headers if there's an error
      logger.rateLimit("warn", "Issue adding rate limiting headers in LiveKit route", {
        metadata: { error: error instanceof Error ? error.message : "Unknown error" },
      });
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      logger.livekit("error", "LiveKit connection creation failed", {
        metadata: { error: error.message },
      });
      return new NextResponse(error.message, { status: 500 });
    }
  }
}

function createParticipantToken(userInfo: AccessTokenOptions, roomName: string) {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: "5m",
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);
  return at.toJwt();
}

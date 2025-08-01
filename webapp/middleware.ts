// edge runtime
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth(async (req) => {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' ${process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    connect-src 'self' ${process.env.NODE_ENV === "development" ? "ws://localhost:7880" : "wss://localhost:7880"};  
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    media-src 'self' blob:;
    upgrade-insecure-requests;
  `;

  const contentSecurityPolicyHeaderValue = cspHeader.replace(/\s{2,}/g, " ").trim();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  requestHeaders.set("Content-Security-Policy", contentSecurityPolicyHeaderValue);

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  res.headers.set("Content-Security-Policy", contentSecurityPolicyHeaderValue);

  // handle guest auth
  if (!req.auth?.id && req.nextUrl.pathname === "/") {
    try {
      const guestId = req.cookies.get("guest_id")?.value;
      if (!guestId) {
        const res2 = await fetch(`${process.env.AUTH_URL}/api/internal/guest`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.INTERNAL_API_KEY!,
          },
        });

        if (!res2.ok) {
          const data = await res2.json();
          // Handle rate limiting specifically
          if (res2.status === 429) {
            let retryAfter;
            if (typeof data.retryAfter !== "number") {
              retryAfter = "60";
            } else {
              retryAfter = data.retryAfter.toString();
            }

            return new NextResponse(
              `Rate limit exceeded. Too many guest creation requests. Please try again in ${retryAfter} seconds.`,
              {
                status: 429,
                headers: {
                  "Retry-After": retryAfter,
                  "Content-Type": "text/plain",
                },
              }
            );
          }

          throw new Error(`Guest API failed with status ${res2.status}.`);
        }

        const data = await res2.json();
        if (!data.guestId || typeof data.guestId !== "string") {
          throw new Error("Invalid guest ID response");
        }

        const { guestId } = data;
        res.cookies.set("guest_id", guestId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          maxAge: 60 * 60 * 24 * 1, // 1 day
        });
      }
    } catch (error) {
      console.error(error);
      // Continue without setting guest ID - application should handle missing guest gracefully
    }
  }

  // Handle internal API routes
  if (req.nextUrl.pathname.startsWith("/api/internal")) {
    const apiKey = req.headers.get("x-api-key");

    if (apiKey !== process.env.INTERNAL_API_KEY) {
      const unauthorizedResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      return unauthorizedResponse;
    }
    return res;
  }
  return res;
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */

    "/((?!_next/static|_next/image|favicon.ico|api/internal/guest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth(async (req) => {
  console.log("HIT MIDDLEWARE!");
  const res = NextResponse.next();

  const guestId = req.cookies.get("guest_id")?.value;

  if (!guestId) {
    const res2 = await fetch(`${process.env.AUTH_URL}/api/internal/guest`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.INTERNAL_API_KEY!,
      },
    });
    const { guestId } = await res2.json();
    res.cookies.set("guest_id", guestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 1, // 1 day
    });
  }

  // Handle internal API routes
  if (req.nextUrl.pathname.startsWith("/api/internal")) {
    const apiKey = req.headers.get("x-api-key");

    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

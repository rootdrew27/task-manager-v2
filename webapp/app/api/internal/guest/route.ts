import { createGuestUser } from "@/db/user";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const guestId = await createGuestUser();

    return NextResponse.json(
      {
        guestId: guestId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Sign-in API error:", error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}

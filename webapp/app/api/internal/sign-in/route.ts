import { createNewUser, getUser } from "@/lib/auth/user";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
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

    return NextResponse.json(
      {
        user: user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Sign-in API error:", error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}

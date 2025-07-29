import type { ProviderName, RefreshTokenResponse, SignInResponse, User } from "@/types/auth";
import { Profile } from "next-auth";
import { JWT, getToken } from "next-auth/jwt";
import { cookies } from "next/headers";

// import { logger } from "@/lib/logger";

/**
 * Fetches or creates a user via the internal API
 */
export async function getUser(profile: Profile, provider: ProviderName): Promise<User | null> {
  try {
    const response = await fetch(`${process.env.AUTH_URL}/api/internal/sign-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.INTERNAL_API_KEY!,
      },
      body: JSON.stringify({ profile, provider }),
    });

    const data: SignInResponse = await response.json();

    if (!response.ok) {
      console.log("Bad response from sign-in API: ", data.error);
      return null;
    }

    return data.user;
  } catch (error) {
    console.error("Error calling sign-in API: ", error);
    return null;
  }
}

/**
 * Configuration for OAuth token refresh endpoints
 */
const TOKEN_ENDPOINTS = {
  google: {
    url: "https://oauth2.googleapis.com/token",
    clientId: () => process.env.AUTH_GOOGLE_ID!,
    clientSecret: () => process.env.AUTH_GOOGLE_SECRET!,
  },
};

/**
 * Refreshes an expired access token
 */
export async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    if (!token.refreshToken) {
      throw new Error("No refresh token available");
    }

    const config = TOKEN_ENDPOINTS[token.provider as ProviderName];

    if (!config) {
      throw new Error(`Unsupported provider: ${token.provider}`);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    const body = new URLSearchParams({
      client_id: config.clientId(),
      client_secret: config.clientSecret(),
      refresh_token: token.refreshToken,
      grant_type: "refresh_token",
    });

    const response = await fetch(config.url, {
      method: "POST",
      headers,
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Issue while refreshing token. Error: ", errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const refreshedTokens: RefreshTokenResponse = await response.json();

    if (!refreshedTokens.access_token) {
      throw new Error("No access token in refresh response");
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpiresAt: Math.floor(Date.now() / 1000) + (refreshedTokens.expires_in || 3600),
      refreshToken: refreshedTokens.refresh_token || token.refreshToken,
      error: [],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(errorMessage);
    return {
      ...token,
      error: [...(token.error || []), "RefreshTokenError"],
    };
  }
}

/**
 * Checks if an access token is expired
 */
export function isTokenExpired(token: JWT): boolean {
  if (!token.accessTokenExpiresAt) {
    return false;
  }
  // Add 5 minute buffer to prevent edge cases
  const bufferTime = 5 * 60;
  return Date.now() / 1000 >= token.accessTokenExpiresAt - bufferTime;
}

/**
 * Revokes a Google token
 */
export async function revokeToken(token: string): Promise<boolean> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        token: token,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Issue while refreshing token. Error: ", errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function getUserId() {
  try {
    const cookieStore = await cookies();

    const token = await getToken({
      req: { headers: { cookie: cookieStore.toString() } },
      secret: process.env.AUTH_SECRET,
    });

    if (token && token.id) {
      return token.id;
    }

    const id = cookieStore.get("guest_id")?.value; // middleware adds this cookie.

    if (!id) throw new Error("Neither a auth or guest id is present.");

    return id;
  } catch (error) {
    throw error;
  }
}

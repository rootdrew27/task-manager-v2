import { providers } from "@/lib/auth/providers";
import { getUser, isTokenExpired, refreshAccessToken } from "@/lib/auth/utils";
import { ProviderName } from "@/types/auth";
import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";
import { Provider } from "next-auth/providers";
import { GoogleProfile } from "next-auth/providers/google";

export const providerMap = providers.map((provider: Provider) => {
  if (typeof provider === "function") {
    const providerData = provider();
    return { id: providerData.id, name: providerData.name };
  } else {
    return { id: provider.id, name: provider.name };
  }
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: providers,
  callbacks: {
    async signIn({ account, profile }) {
      try {
        if (!profile || !account) {
          console.error("OAuth profile or account missing");
          return false;
        }

        // Validate Google sign-in
        if (account.provider === "google") {
          const googleProfile = profile as GoogleProfile;
          if (!googleProfile.email) {
            console.error("Google profile missing email");
            return false;
          }
          return true;
        }

        console.error(`Unsupported provider: ${account.provider}`);
        return false;
      } catch (error) {
        console.error("Sign-in callback error:", error);
        return false;
      }
    },
    async jwt({ token, account, profile }) {
      try {
        if (token.error && token.error.length > 0) {
          console.log("JWT: Error present, returning early.");
          return token;
        }
        // Handle initial sign-in
        if (account && profile) {
          console.log("JWT: Signin.");
          const user = await getUser(profile, account.provider as ProviderName);

          if (!user) {
            console.error("Failed to get (or create) user");
            return {
              ...token,
              error: ["GetUserError"],
            } as JWT;
          }

          return {
            ...token,
            id: user.id,
            provider: account.provider as ProviderName,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            accessTokenExpiresAt: account.expires_at!,
            error: [],
          } as JWT;
        }

        // Check if we have the required token data
        if (!token.provider || !token.accessTokenExpiresAt) {
          console.error("Missing required token data");
          return {
            ...token,
            error: [...(token.error || []), "JWTError"],
          } as JWT;
        }

        // Return existing token if still valid
        if (!isTokenExpired(token)) {
          return token;
        }

        // Token expired - attempt refresh
        console.log("JWT: Refreshing token.");
        return await refreshAccessToken(token);
      } catch (error) {
        console.error("JWT callback error:", error);
        return {
          ...token,
          error: [...(token.error || []), (error as Error).message],
        } as JWT;
      }
    },
    async session({ session, token }) {
      if (token) {
        if (token.id) {
          session.id = token.id;
        }
        session.error = token.error;
      }

      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
});

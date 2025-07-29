// edge runtime
import { providers } from "@/lib/auth/providers";
import { getUser, isTokenExpired, refreshAccessToken } from "@/lib/auth/utils";
import { ProviderName } from "@/types/auth";
import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";
import { Provider } from "next-auth/providers";
import { GoogleProfile } from "next-auth/providers/google";

// import { logger } from "@/lib/logger";

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
          // logger.auth('error', 'OAuth profile or account missing during sign-in', {
          //   metadata: { provider: account?.provider }
          // });
          return false;
        }

        // Validate Google sign-in
        if (account.provider === "google") {
          const googleProfile = profile as GoogleProfile;
          if (!googleProfile.email) {
            // logger.auth('error', 'Google profile missing email', {
            //   metadata: { profileId: googleProfile.sub }
            // });
            return false;
          }
          // logger.auth('info', 'Successful Google sign-in', {
          //   metadata: { email: googleProfile.email, profileId: googleProfile.sub }
          // });
          return true;
        }

        // logger.auth('error', `Unsupported provider: ${account.provider}`);
        return false;
      } catch (error) {
        // logger.auth('error', 'Sign-in callback error', {
        //   metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
        // });
        return false;
      }
    },
    async jwt({ token, account, profile }) {
      try {
        if (token.error && token.error.length > 0) {
          // logger.auth('warn', 'JWT token has existing errors', {
          //   metadata: { errors: token.error }
          // });
          return token;
        }
        // Handle initial sign-in
        if (account && profile) {
          // logger.auth('info', 'JWT: Processing initial sign-in', {
          //   metadata: { provider: account.provider }
          // });
          const user = await getUser(profile, account.provider as ProviderName);

          if (!user) {
            // logger.auth('error', 'Failed to get or create user', {
            //   metadata: { provider: account.provider }
            // });
            return {
              ...token,
              error: ["GetUserError"],
            } as JWT;
          }

          // logger.auth('info', 'Successfully created JWT token', {
          //   userId: user.id,
          //   metadata: { provider: account.provider }
          // });
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
          // logger.auth('error', 'Missing required token data', {
          //   userId: token.id as string,
          //   metadata: { hasProvider: !!token.provider, hasExpiresAt: !!token.accessTokenExpiresAt }
          // });
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
        // logger.auth('info', 'JWT token expired, attempting refresh', {
        //   userId: token.id as string,
        //   metadata: { provider: token.provider }
        // });
        return await refreshAccessToken(token);
      } catch (error) {
        // logger.auth('error', 'JWT callback error', {
        //   userId: token.id as string,
        //   metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
        // });
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

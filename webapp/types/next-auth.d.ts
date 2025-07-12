import { AuthError, ProviderName } from "@/auth";

declare module "next-auth" {
  interface Session {
    id: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number; // seconds
    error?: AuthError[];
    username: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: number; // seconds
    provider: ProviderName;
    error?: AuthError[];
  }
}

declare module "next-auth/providers/google" {
  interface GoogleProfile {
    refreshToken?: string;
    connectedAt?: Date;
  }
}

declare module "next-auth/providers/twitter" {
  interface TwitterProfile {
    refreshToken?: string;
    connectedAt?: Date;
  }
}

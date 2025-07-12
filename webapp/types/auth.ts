import { GoogleProfile } from "next-auth/providers/google";

export type ProviderName = "google";

export type ProviderProfile = GoogleProfile;

export type AuthError = "RefreshTokenError" | "SignInError" | "JWTError" | "GetUserError";

export interface SignInRequest {
  profile: ProviderProfile;
  provider: ProviderName;
}

export interface SignInResponse {
  user: User;
}

export interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

export interface User {
  id: string;
  createdAt: Date;
}

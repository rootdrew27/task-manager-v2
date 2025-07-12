import Google from "next-auth/providers/google";

const googleProvider = Google({
  clientId: process.env.AUTH_GOOGLE_ID,
  clientSecret: process.env.AUTH_GOOGLE_SECRET,
  authorization: {
    params: {
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
      response_type: "code",
    },
  },
});

export const providers = [googleProvider];

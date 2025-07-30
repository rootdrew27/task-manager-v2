import { signIn, signOut } from "@/auth";
import { Session } from "next-auth";
import { redirect } from "next/navigation";
import { SignInOrOutButton } from "./sign-in-or-out-button";

interface NavbarProps {
  session: Session | null;
}

export function Navbar({ session }: NavbarProps) {
  const handleSignOut = async () => {
    "use server";
    await signOut({ redirect: false });
  };

  const handleSignIn = async () => {
    "use server";
    const signInUrl = await signIn(undefined, { redirect: false });
    const signInUrlParams = new URL(signInUrl).searchParams;
    const callbackUrl = signInUrlParams.get("callbackUrl") ?? "/";

    redirect(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  };

  return (
    <div>
      <SignInOrOutButton
        isSignedIn={!!session}
        handleSignIn={handleSignIn}
        handleSignOut={handleSignOut}
      />
    </div>
  );
}

import { SignIn } from "@/components/auth/sign-in";
import { SignOut } from "@/components/auth/sign-out";
import { Session } from "next-auth";

interface NavbarProps {
  session: Session | null;
}

export function Navbar({ session }: NavbarProps) {
  return <div className="absolute z-10 right-0 p-2">{session ? <SignOut /> : <SignIn />}</div>;
}

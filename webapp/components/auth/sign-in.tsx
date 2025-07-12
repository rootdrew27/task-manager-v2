import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export function SignIn() {
  return (
    <form
      action={async () => {
        "use server";
        const signInUrl = await signIn(undefined, { redirect: false });
        const signInUrlParams = new URL(signInUrl).searchParams;
        const callbackUrl = signInUrlParams.get("callbackUrl") ?? "/";

        redirect(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      }}
    >
      <Button className="bg-white text-black" role="button" type="submit">
        Sign in
      </Button>
    </form>
  );
}

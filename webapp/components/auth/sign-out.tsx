import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export function SignOut() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut();
      }}
    >
      <Button className="bg-white text-black" role="button" type="submit">
        Sign Out
      </Button>
    </form>
  );
}

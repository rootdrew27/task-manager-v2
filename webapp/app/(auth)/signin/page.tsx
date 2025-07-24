import { providerMap, signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

const SIGNIN_ERROR_URL = "/signin/error";

export default async function SignIn(props: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-8">
      <div className="grid gap-4 w-full max-w-md mx-auto">
        {searchParams?.error === "session_expired" && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700 text-sm">
              Your session has expired. Please sign in again to continue.
            </p>
          </div>
        )}
        {Object.values(providerMap).map((provider) => (
          <form
            key={provider.id}
            action={async () => {
              "use server";
              try {
                await signIn(provider.id, {
                  redirectTo: searchParams?.callbackUrl ?? "",
                });
              } catch (error) {
                // Signin can fail for a number of reasons, such as the user
                // not existing, or the user not having the correct role.
                // In some cases, you may want to redirect to a custom error
                if (error instanceof AuthError) {
                  return redirect(`${SIGNIN_ERROR_URL}?error=${error.type}`);
                }

                // Otherwise if a redirects happens Next.js can handle it
                // so you can just re-thrown the error and let Next.js handle it.
                // Docs:
                // https://nextjs.org/docs/app/api-reference/functions/redirect#server-component
                throw error;
              }
            }}
          >
            <button
              type="submit"
              className="bg-primary rounded-lg p-4 w-full text-oxford-blue font-medium transition-colors hover:bg-primary/90 shadow-black/10 shadow-sm hover:cursor-pointer"
            >
              Sign in with {provider.name.trim()}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}

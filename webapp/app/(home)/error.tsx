"use client";

// Error boundaries must be Client Components
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-8">
      <div className="grid gap-4 w-full max-w-md mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h2 className="text-red-700 text-lg font-medium mb-2">Something went wrong!</h2>
          <p className="text-red-700 text-sm mb-4">
            An unexpected error occurred. Please try again.
          </p>
        </div>
        <button
          onClick={() => reset()}
          className="bg-primary rounded-lg p-4 w-full text-oxford-blue font-medium transition-colors hover:bg-primary/90 shadow-black/10 shadow-sm hover:cursor-pointer"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

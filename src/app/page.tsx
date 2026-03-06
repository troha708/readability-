import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { AuthButton } from "@/components/auth-button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="space-y-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          Welcome to Readability
        </h1>

        {user ? (
          <div className="space-y-4">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Signed in as <span className="font-medium text-gray-900 dark:text-white">{user.email}</span>
            </p>
            <AuthButton>Sign out</AuthButton>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Get started by signing in or creating an account.
            </p>
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-4">
                <Link
                  href="/login"
                  className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                >
                  Sign up
                </Link>
              </div>
              <Link
                href="/try"
                className="rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
              >
                Try it now
              </Link>
            </div>
          </div>
        )}

        <p className="mt-8 text-sm text-gray-500 dark:text-gray-500">
          Edit{" "}
          <code className="rounded bg-gray-100 px-2 py-1 font-mono dark:bg-gray-800">
            src/app/page.tsx
          </code>{" "}
          to customize this page.
        </p>
      </div>
    </main>
  );
}

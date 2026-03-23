"use client";

import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AuthButton() {
  const { user, loading } = useUser();
  const router = useRouter();

  if (loading) {
    return (
      <div className="h-8 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login?next=/try/bible/start"
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        Sign in
      </Link>
    );
  }

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3">
      <span className="max-w-[180px] truncate text-sm text-gray-600 dark:text-gray-400">
        {user.email}
      </span>
      <button
        onClick={handleSignOut}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        Sign out
      </button>
    </div>
  );
}

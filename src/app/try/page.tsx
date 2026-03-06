import Link from "next/link";

export default function TrySelectPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Choose a book
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Start reading with no account. You can sign up later to save your progress.
        </p>
        <div className="space-y-4">
          <Link
            href="/try/bible/start"
            className="block rounded-xl border-2 border-gray-200 bg-white p-6 text-left shadow-sm transition hover:border-emerald-500 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-emerald-500"
          >
            <span className="text-xl font-semibold text-gray-900 dark:text-white">
              Bible
            </span>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Start at John, Chapter 1
            </p>
          </Link>
          {/* Add more books later */}
        </div>
        <Link
          href="/"
          className="inline-block text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-400"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}

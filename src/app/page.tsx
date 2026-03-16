import Link from "next/link";
import { Logo } from "@/components/logo";

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4">
        <Logo />
        <Link
          href="/login?next=/try"
          className="text-sm font-medium text-gray-600 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero — two-column layout */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-12 lg:flex lg:items-center lg:gap-16 lg:pt-20">
        <div className="lg:flex-1">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
            Readability
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-500 dark:text-gray-400">
            Build your daily Bible reading habit. Comprehension questions. Real
            understanding.
          </p>
          <Link
            href="/try"
            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98]"
          >
            Start Reading
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Browser mockup preview */}
        <div className="mt-12 lg:mt-0 lg:flex-1">
          <div className="overflow-hidden rounded-xl border border-gray-200 shadow-2xl dark:border-gray-700">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-100 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="ml-4 flex-1 rounded-md bg-white px-3 py-1.5 text-xs text-gray-400 dark:bg-gray-900 dark:text-gray-500">
                readability.app/try/bible/read
              </div>
            </div>
            {/* Mock content */}
            <div className="space-y-6 bg-white p-6 dark:bg-gray-900">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  John 1
                </p>
                <p className="mt-2 leading-relaxed text-gray-800 dark:text-gray-200">
                  <sup>1</sup> In the beginning was the Word, and the Word was
                  with God, and the Word was God. <sup>2</sup> He was in the
                  beginning with God. <sup>3</sup> All things were made through
                  him, and without him was not any thing made that was made.
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  According to verse 1, where was the Word in the beginning?
                </p>
                <div className="space-y-2">
                  <div className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                    In heaven
                  </div>
                  <div className="rounded-md border-2 border-emerald-500 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-400">
                    With God
                  </div>
                  <div className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                    On earth
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards — equal height with hover effects */}
      <section className="mx-auto max-w-5xl px-6 pb-12">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-gray-50 p-6 transition-all hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/10 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-emerald-800">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <svg
                className="h-6 w-6 text-emerald-600 dark:text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Daily Reading Sessions
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              Bite-sized chapters broken into manageable chunks so you can read
              consistently, every single day.
            </p>
          </div>

          <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-gray-50 p-6 transition-all hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/10 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-emerald-800">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <svg
                className="h-6 w-6 text-emerald-600 dark:text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Comprehension Questions
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              Quiz yourself after each chapter to reinforce what you read and
              build real understanding.
            </p>
          </div>

          <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-gray-50 p-6 transition-all hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/10 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-emerald-800">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <svg
                className="h-6 w-6 text-emerald-600 dark:text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Track Your Progress
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              Watch your streak grow, see chapters turn green, and stay motivated
              with visible progress.
            </p>
          </div>
        </div>

        {/* Stat line */}
        <p className="mt-10 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
          1,300+ comprehension questions across every New Testament book
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 dark:border-gray-800">
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Readability
        </p>
      </footer>
    </main>
  );
}

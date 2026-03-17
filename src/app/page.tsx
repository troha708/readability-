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
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-6 lg:flex lg:items-stretch lg:gap-16 lg:pt-8">
        <div className="flex flex-col justify-center lg:flex-1">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
            Readability
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-500 dark:text-gray-400">
            Read the Bible. Actually remember it.
          </p>
          <div className="mt-10 inline-flex flex-col items-center self-start">
            <Link
              href="/try"
              className="w-fit inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98]"
            >
              Start Reading
              <span aria-hidden="true">→</span>
            </Link>
            <p className="mt-3 w-full text-center text-sm text-gray-500 dark:text-gray-400">
              Free. No account required.
            </p>
          </div>
        </div>

        {/* Browser mockup preview — dark theme, matches design */}
        <div className="mt-12 lg:mt-0 lg:flex-1 lg:min-w-0">
          <div className="dark mx-auto w-full max-w-3xl overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-gray-700 bg-gray-800 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="ml-4 flex-1 rounded-md bg-gray-900 px-3 py-1.5 text-xs text-gray-500">
                readability.app/try/bible/read
              </div>
            </div>

            {/* App header bar */}
            <div className="border-b border-gray-700 bg-gray-900/95 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-base font-bold text-gray-200">
                  Readability
                </span>
                <div className="h-4 w-px shrink-0 bg-gray-600" />
                <span className="shrink-0 text-sm text-gray-400">←</span>
                <span className="rounded-md border border-gray-600 px-2.5 py-1 text-sm font-medium text-gray-300">
                  John 1 <span className="text-gray-500">▾</span>
                </span>
                <div className="flex-1" />
                <span className="text-sm text-gray-400">Study</span>
                <span className="rounded-md border border-gray-600 px-2.5 py-1 text-sm font-medium text-gray-400">
                  WEB
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: "75%" }}
                  />
                </div>
              </div>
            </div>

            {/* Mock content — full height, nothing cut off */}
            <div className="space-y-6 bg-gray-900 p-6 pb-8" style={{ fontSize: "17px" }}>
              {/* Bible verses with emerald verse numbers */}
              <p className="leading-relaxed text-gray-300">
                <sup className="ml-1 mr-px align-super text-[0.6em] font-bold text-emerald-400">
                  1
                </sup>{" "}
                In the beginning was the Word, and the Word was with God, and
                the Word was God.{" "}
                <sup className="ml-1 mr-px align-super text-[0.6em] font-bold text-emerald-400">
                  2
                </sup>{" "}
                The same was in the beginning with God.{" "}
                <sup className="ml-1 mr-px align-super text-[0.6em] font-bold text-emerald-400">
                  3
                </sup>{" "}
                All things were made through him. Without him, nothing was made
                that has been made.
              </p>

              {/* Question card */}
              <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-5">
                <span className="mb-3 inline-block rounded px-2.5 py-1 text-xs font-medium text-white bg-gray-700">
                  Multiple Choice
                </span>
                <p className="mb-4 text-base font-medium text-gray-300">
                  According to verse 1, where was the Word in the beginning?
                </p>
                <div className="space-y-2">
                  <div className="rounded-xl border-2 border-gray-600 px-4 py-3.5 text-sm text-gray-400">
                    In heaven
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border-2 border-emerald-500 bg-emerald-900/20 px-4 py-3.5 text-sm font-medium text-gray-300">
                    <span className="text-emerald-400">✓</span> With God
                  </div>
                  <div className="rounded-xl border-2 border-gray-600 px-4 py-3.5 text-sm text-gray-400">
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
        <p className="mt-10 text-center text-sm font-medium text-gray-900 dark:text-white">
          <span className="font-bold text-emerald-500 dark:text-emerald-400">1,300+</span>{" "}
          comprehension questions across every New Testament book
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 dark:border-gray-800">
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Readability
        </p>
        <p className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
          Feedback?{" "}
          <a href="mailto:readablebibleapp@gmail.com" className="underline hover:text-gray-600 dark:hover:text-gray-400">
            readablebibleapp@gmail.com
          </a>
        </p>
      </footer>
    </main>
  );
}

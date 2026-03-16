"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  getReadingMode,
  setReadingMode,
  type ReadingMode,
  type ReadingProgress,
  type StreakInfo,
} from "@/lib/reading-progress";
import {
  loadAllProgress,
  getStreakInfo,
} from "@/lib/progress-service";
import { AuthButton } from "@/components/auth-button";
import { Logo } from "@/components/logo";
import { useUser } from "@/hooks/useUser";

const BIBLE_BOOK_ORDER = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
  "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles",
  "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
  "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah",
  "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah",
  "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts",
  "Romans", "1 Corinthians", "2 Corinthians", "Galatians",
  "Ephesians", "Philippians", "Colossians",
  "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy",
  "Titus", "Philemon", "Hebrews", "James",
  "1 Peter", "2 Peter", "1 John", "2 John", "3 John",
  "Jude", "Revelation",
];

type ChapterInfo = { chapterNumber: number; chunkCount: number };

export type BookInfo = {
  name: string;
  testament: string;
  chapters: ChapterInfo[];
};

type Props = {
  books: BookInfo[];
  versionAbbr: string;
};

function bookSortKey(name: string): number {
  const idx = BIBLE_BOOK_ORDER.indexOf(name);
  return idx >= 0 ? idx : 999;
}

type CompletionAge = "recent" | "fading" | "old";

function getCompletionAge(timestamp: string | undefined): CompletionAge {
  if (!timestamp) return "old";
  const days = (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 7) return "recent";
  if (days <= 30) return "fading";
  return "old";
}

const AGE_STYLES = {
  recent: {
    button:
      "bg-emerald-100 font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-400 dark:ring-emerald-700",
    badge: "bg-emerald-500 text-white",
    icon: "text-emerald-500 dark:text-emerald-400",
  },
  fading: {
    button:
      "bg-emerald-50 font-semibold text-emerald-600/60 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/25 dark:text-emerald-500/50 dark:ring-emerald-800/60",
    badge: "bg-emerald-400/70 text-white dark:bg-emerald-700",
    icon: "text-emerald-400/70 dark:text-emerald-600",
  },
  old: {
    button:
      "bg-emerald-50/60 font-semibold text-emerald-500/50 ring-1 ring-inset ring-emerald-200/60 dark:bg-emerald-950/15 dark:text-emerald-600/40 dark:ring-emerald-800/40",
    badge: "bg-emerald-300/60 text-white dark:bg-emerald-800/60",
    icon: "text-emerald-300/60 dark:text-emerald-700/50",
  },
} as const;

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );
}

export function BibleRoadmap({ books, versionAbbr }: Props) {
  const { user, loading: userLoading } = useUser();
  const [selected, setSelected] = useState<{ book: string; chapter: number }>({
    book: "John",
    chapter: 1,
  });
  const johnRef = useRef<HTMLDivElement>(null);
  const [readingDone, setReadingDone] = useState<ReadingProgress>({});
  const [quizDone, setQuizDone] = useState<ReadingProgress>({});
  const [timestamps, setTimestamps] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<ReadingMode>("study");
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set());
  const [continueTarget, setContinueTarget] = useState<{ book: string; chapter: number }>({
    book: "John",
    chapter: 1,
  });
  const [streak, setStreak] = useState<StreakInfo>({ streak: 0, completedToday: false });

  useEffect(() => {
    async function init() {
      const { read: readProg, quiz: quizProg, timestamps: ts } = await loadAllProgress();
      setReadingDone(readProg);
      setQuizDone(quizProg);
      setTimestamps(ts);
      const currentMode = getReadingMode();
      setMode(currentMode);
      setStreak(getStreakInfo());

      const isFullyDone = (bookName: string, chNum: number) => {
        const key = `${bookName}:${chNum}`;
        if (currentMode === "read") return !!readProg[key];
        return !!readProg[key] && !!quizProg[key];
      };

      const inProgress = new Set<string>();
      const sorted = [...books].sort((a, b) => bookSortKey(a.name) - bookSortKey(b.name));

      let lastActiveBook: BookInfo | null = null;
      for (const book of sorted) {
        if (book.chapters.length === 0) continue;
        const hasAny = book.chapters.some((ch) => isFullyDone(book.name, ch.chapterNumber));
        const allDone = book.chapters.every((ch) => isFullyDone(book.name, ch.chapterNumber));
        if (hasAny && !allDone) {
          inProgress.add(book.name);
          lastActiveBook = book;
        }
      }
      if (inProgress.size === 0) inProgress.add("John");
      setExpandedBooks(inProgress);

      if (lastActiveBook) {
        const firstIncomplete = lastActiveBook.chapters.find(
          (ch) => !isFullyDone(lastActiveBook.name, ch.chapterNumber),
        );
        setContinueTarget({
          book: lastActiveBook.name,
          chapter: firstIncomplete ? firstIncomplete.chapterNumber : 1,
        });
      } else {
        setContinueTarget({ book: "John", chapter: 1 });
      }
    }
    init();
  }, [books]);

  useEffect(() => {
    const t = setTimeout(() => {
      johnRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    return () => clearTimeout(t);
  }, []);

  const sorted = [...books].sort((a, b) => bookSortKey(a.name) - bookSortKey(b.name));
  const otBooks = sorted.filter((b) => b.testament === "OT");
  const ntBooks = sorted.filter((b) => b.testament === "NT");

  function toggleBook(bookName: string) {
    setExpandedBooks((prev) => {
      const next = new Set(prev);
      if (next.has(bookName)) next.delete(bookName);
      else next.add(bookName);
      return next;
    });
  }

  function readUrl(book: string, chapter: number) {
    return `/try/bible/read?book=${encodeURIComponent(book)}&chapter=${chapter}&chunk=1&version=${versionAbbr}`;
  }

  function renderSection(label: string, sectionBooks: BookInfo[]) {
    return (
      <div className="mb-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            {label}
          </span>
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="relative ml-3 border-l-2 border-gray-200 dark:border-gray-700">
          {sectionBooks.map((book) => {
            const isJohn = book.name === "John";
            const hasChapters = book.chapters.length > 0;
            const isSelectedBook = selected.book === book.name;
            const isStudy = mode === "study";
            const completedCount = book.chapters.filter((ch) => {
              const key = `${book.name}:${ch.chapterNumber}`;
              if (!isStudy) return !!readingDone[key];
              return !!readingDone[key] && !!quizDone[key];
            }).length;
            const allComplete = hasChapters && completedCount === book.chapters.length;
            const isExpanded = expandedBooks.has(book.name);
            const selectedChapter = book.chapters.find(
              (c) => c.chapterNumber === selected.chapter,
            );

            return (
              <div
                key={book.name}
                ref={isJohn ? johnRef : undefined}
                className="relative py-2.5 pl-8"
              >
                {/* Timeline dot */}
                <div
                  className={`absolute -left-[9px] top-3.5 h-4 w-4 rounded-full border-2 ${
                    allComplete
                      ? "border-emerald-500 bg-emerald-500"
                      : isJohn
                        ? "border-emerald-500 bg-emerald-500"
                        : hasChapters
                          ? "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
                          : "border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
                  }`}
                />

                {/* Book name — clickable to expand/collapse */}
                <button
                  onClick={() => hasChapters && toggleBook(book.name)}
                  className={`flex items-center gap-2 ${hasChapters ? "cursor-pointer" : "cursor-default"}`}
                >
                  {hasChapters && (
                    <svg
                      className={`h-3.5 w-3.5 flex-shrink-0 text-gray-400 transition-transform duration-200 dark:text-gray-500 ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  <h3
                    className={`text-sm font-semibold ${
                      hasChapters
                        ? "text-gray-800 dark:text-gray-200"
                        : "text-gray-400 dark:text-gray-600"
                    }`}
                  >
                    {book.name}
                  </h3>
                  {isJohn && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                      Start here
                    </span>
                  )}
                  {!isExpanded && hasChapters && (
                    <span className="text-[0.65rem] text-gray-400 dark:text-gray-500">
                      {book.chapters.length} ch.
                      {completedCount > 0 && ` · ${completedCount} done`}
                    </span>
                  )}
                </button>

                {/* Collapsible chapter grid + begin button */}
                {isExpanded && hasChapters && (
                  <>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {book.chapters.map((ch) => {
                        const isSel =
                          isSelectedBook && ch.chapterNumber === selected.chapter;
                        const key = `${book.name}:${ch.chapterNumber}`;
                        const readComplete = !!readingDone[key];
                        const quizComplete = !!quizDone[key];
                        const isComplete = isStudy
                          ? readComplete && quizComplete
                          : readComplete;
                        const age = isComplete ? getCompletionAge(timestamps[key]) : null;
                        const ageStyle = age ? AGE_STYLES[age] : null;
                        return (
                          <button
                            key={ch.chapterNumber}
                            onClick={() =>
                              setSelected({
                                book: book.name,
                                chapter: ch.chapterNumber,
                              })
                            }
                            className={`relative flex ${
                              isStudy ? "h-11 min-w-[2.25rem] flex-col gap-0.5" : "h-7 min-w-[1.75rem]"
                            } items-center justify-center rounded px-1 text-xs tabular-nums transition-colors ${
                              isSel
                                ? "bg-emerald-500 font-semibold text-white shadow-sm"
                                : ageStyle
                                  ? ageStyle.button
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                            }`}
                          >
                            <span className={isStudy ? "leading-none" : ""}>
                              {ch.chapterNumber}
                            </span>
                            {isStudy && (
                              <span className="flex items-center gap-1">
                                <BookIcon
                                  className={`h-3 w-3 ${
                                    isSel
                                      ? readComplete ? "text-white" : "text-emerald-200"
                                      : readComplete
                                        ? (ageStyle?.icon ?? "text-emerald-500 dark:text-emerald-400")
                                        : "text-gray-300 dark:text-gray-600"
                                  }`}
                                />
                                <PencilIcon
                                  className={`h-3 w-3 ${
                                    isSel
                                      ? quizComplete ? "text-white" : "text-emerald-200"
                                      : quizComplete
                                        ? (ageStyle?.icon ?? "text-emerald-500 dark:text-emerald-400")
                                        : "text-gray-300 dark:text-gray-600"
                                  }`}
                                />
                              </span>
                            )}
                            {ch.chunkCount > 1 && (
                              <span
                                className={`absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[0.5rem] font-bold leading-none ${
                                  isSel
                                    ? "bg-emerald-700 text-emerald-100"
                                    : ageStyle
                                      ? ageStyle.badge
                                      : "bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
                                }`}
                              >
                                {ch.chunkCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {isSelectedBook && (
                      <div className="mt-3 flex items-center gap-3">
                        <Link
                          href={readUrl(book.name, selected.chapter)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                        >
                          Begin Reading
                          <span aria-hidden="true">→</span>
                        </Link>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {book.name} {selected.chapter}
                          {selectedChapter && selectedChapter.chunkCount > 1
                            ? ` · ${selectedChapter.chunkCount} parts`
                            : ""}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Navbar */}
        <div className="mb-4 flex items-center justify-between">
          <Logo />
          <AuthButton />
        </div>

        {/* Sign-in banner for guests */}
        {!userLoading && !user && (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 dark:border-blue-800 dark:bg-blue-950/40">
            <svg className="h-4 w-4 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            </svg>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <Link href="/login?next=/try" className="font-medium underline hover:no-underline">
                Sign in
              </Link>{" "}
              to save your progress across devices
            </p>
          </div>
        )}

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            The Bible
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Navigate the complete Bible. Your journey begins at John.
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Version: {versionAbbr}
          </p>

          {/* Streak counter */}
          <div className="mt-5 inline-flex flex-col items-center gap-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 dark:bg-amber-950/40">
              <svg
                className={`h-5 w-5 ${streak.streak > 0 ? "text-amber-500" : "text-gray-300 dark:text-gray-600"}`}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 23c-3.866 0-7-3.134-7-7 0-2.812 1.631-5.238 4-6.414V2l3.5 3.5L16 2v7.586c2.369 1.176 4 3.602 4 6.414 0 3.866-3.134 7-7 7zm0-2a5 5 0 0 0 5-5c0-2.083-1.249-3.876-3.038-4.67L13 10.9V6.41l-1 1-1-1V10.9l-.962.43C8.249 12.124 7 13.917 7 16a5 5 0 0 0 5 5zm-1-4a1 1 0 0 1 2 0 1.5 1.5 0 0 1-2 2v-2z" />
              </svg>
              <span className="text-lg font-bold tabular-nums text-amber-700 dark:text-amber-400">
                {streak.streak}
              </span>
              <span className="text-xs font-medium text-amber-600 dark:text-amber-500">
                {streak.streak === 1 ? "day" : "days"}
              </span>
            </div>
            {!streak.completedToday && (
              <p className="text-[0.65rem] font-medium text-amber-600 dark:text-amber-500">
                {streak.streak > 0
                  ? "Complete a chapter to keep your streak alive!"
                  : "Complete a chapter to start your streak!"}
              </p>
            )}
          </div>

          {/* Reading mode toggle */}
          <div className="mt-4 flex flex-col items-center gap-1.5">
            <div className="inline-flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
              <button
                onClick={() => {
                  setMode("study");
                  setReadingMode("study");
                }}
                className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  mode === "study"
                    ? "bg-white text-emerald-700 shadow-sm dark:bg-gray-700 dark:text-emerald-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Study Mode
              </button>
              <button
                onClick={() => {
                  setMode("read");
                  setReadingMode("read");
                }}
                className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  mode === "read"
                    ? "bg-white text-emerald-700 shadow-sm dark:bg-gray-700 dark:text-emerald-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Read Mode
              </button>
            </div>
            <p className="text-[0.65rem] text-gray-400 dark:text-gray-500">
              {mode === "study"
                ? "Comprehension questions after each chapter"
                : "Read without questions"}
            </p>
          </div>

          {/* Continue Reading button */}
          <Link
            href={readUrl(continueTarget.book, continueTarget.chapter)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 text-lg font-bold text-white shadow-md transition-colors hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            Continue Reading
            <span className="text-base font-normal text-emerald-200">
              {continueTarget.book} {continueTarget.chapter}
            </span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {renderSection("Old Testament", otBooks)}
        {renderSection("New Testament", ntBooks)}

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            href="/try"
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-400"
          >
            ← Back to book selection
          </Link>
        </div>
      </div>
    </main>
  );
}

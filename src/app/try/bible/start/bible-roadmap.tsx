"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  getProgress,
  getReadingMode,
  setReadingMode,
  type ReadingMode,
  type ReadingProgress,
} from "@/lib/reading-progress";

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

export function BibleRoadmap({ books, versionAbbr }: Props) {
  const [selected, setSelected] = useState<{ book: string; chapter: number }>({
    book: "John",
    chapter: 1,
  });
  const johnRef = useRef<HTMLDivElement>(null);
  const [completedChapters, setCompletedChapters] = useState<ReadingProgress>({});
  const [mode, setMode] = useState<ReadingMode>("study");
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set());
  const [continueTarget, setContinueTarget] = useState<{ book: string; chapter: number }>({
    book: "John",
    chapter: 1,
  });

  useEffect(() => {
    const progress = getProgress();
    setCompletedChapters(progress);
    setMode(getReadingMode());

    const inProgress = new Set<string>();
    const sorted = [...books].sort((a, b) => bookSortKey(a.name) - bookSortKey(b.name));

    let lastActiveBook: BookInfo | null = null;
    for (const book of sorted) {
      if (book.chapters.length === 0) continue;
      const hasAny = book.chapters.some((ch) => !!progress[`${book.name}:${ch.chapterNumber}`]);
      const allDone = book.chapters.every((ch) => !!progress[`${book.name}:${ch.chapterNumber}`]);
      if (hasAny && !allDone) {
        inProgress.add(book.name);
        lastActiveBook = book;
      }
    }
    if (inProgress.size === 0) inProgress.add("John");
    setExpandedBooks(inProgress);

    if (lastActiveBook) {
      const firstIncomplete = lastActiveBook.chapters.find(
        (ch) => !progress[`${lastActiveBook.name}:${ch.chapterNumber}`],
      );
      setContinueTarget({
        book: lastActiveBook.name,
        chapter: firstIncomplete ? firstIncomplete.chapterNumber : 1,
      });
    } else {
      setContinueTarget({ book: "John", chapter: 1 });
    }
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
            const completedCount = book.chapters.filter(
              (ch) => !!completedChapters[`${book.name}:${ch.chapterNumber}`],
            ).length;
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
                        const isComplete =
                          !!completedChapters[`${book.name}:${ch.chapterNumber}`];
                        return (
                          <button
                            key={ch.chapterNumber}
                            onClick={() =>
                              setSelected({
                                book: book.name,
                                chapter: ch.chapterNumber,
                              })
                            }
                            className={`relative flex h-7 min-w-[1.75rem] items-center justify-center rounded px-1 text-xs tabular-nums transition-colors ${
                              isSel
                                ? "bg-emerald-500 font-semibold text-white shadow-sm"
                                : isComplete
                                  ? "bg-emerald-100 font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-400 dark:ring-emerald-700"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                            }`}
                          >
                            {ch.chapterNumber}
                            {ch.chunkCount > 1 && (
                              <span
                                className={`absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[0.5rem] font-bold leading-none ${
                                  isSel
                                    ? "bg-emerald-700 text-emerald-100"
                                    : isComplete
                                      ? "bg-emerald-500 text-white"
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

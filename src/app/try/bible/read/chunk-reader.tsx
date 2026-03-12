"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getReadingMode,
  setReadingMode,
  type ReadingMode,
} from "@/lib/reading-progress";
import {
  markChapterComplete,
  markReadingComplete,
} from "@/lib/progress-service";
import { FormattedChunkText } from "./format-chunk-text";

type VersionInfo = { abbr: string; name: string };

type Props = {
  bookName: string;
  chapterNumber: number;
  chunkNumber: number;
  totalChunks: number;
  chunkText: string;
  hasNextChunk: boolean;
  versionAbbr: string;
  versionName: string;
  availableVersions: VersionInfo[];
  chapterNumbers: number[];
};

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function ChunkReader({
  bookName,
  chapterNumber,
  chunkNumber,
  totalChunks,
  chunkText,
  hasNextChunk,
  versionAbbr,
  versionName,
  availableVersions,
  chapterNumbers,
}: Props) {
  const router = useRouter();
  const [readProgress, setReadProgress] = useState(0);
  const [versionOpen, setVersionOpen] = useState(false);
  const [chapterOpen, setChapterOpen] = useState(false);
  const versionRef = useRef<HTMLDivElement>(null);
  const chapterRef = useRef<HTMLDivElement>(null);

  const [dark, setDark] = useState(false);
  const [bionic, setBionic] = useState(false);
  const [mode, setMode] = useState<ReadingMode>("study");

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setBionic(localStorage.getItem("bionic") === "true");
    setMode(getReadingMode());
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  function toggleBionic() {
    const next = !bionic;
    setBionic(next);
    localStorage.setItem("bionic", String(next));
  }

  async function handleFinishReading() {
    if (hasNextChunk) {
      router.push(readUrl({ chunk: chunkNumber + 1 }));
    } else if (mode === "study") {
      await markReadingComplete(bookName, chapterNumber);
      router.push(
        `/try/bible/questions/${encodeURIComponent(bookName)}/${chapterNumber}?version=${versionAbbr}`,
      );
    } else {
      await markChapterComplete(bookName, chapterNumber);
      const currentIdx = chapterNumbers.indexOf(chapterNumber);
      const nextChapter = chapterNumbers[currentIdx + 1];
      if (nextChapter !== undefined) {
        router.push(readUrl({ chapter: nextChapter, chunk: 1 }));
      } else {
        router.push("/try/bible/start");
      }
    }
  }

  function handleGoBack() {
    if (chunkNumber > 1) {
      router.push(readUrl({ chunk: chunkNumber - 1 }));
    } else {
      router.back();
    }
  }

  const updateProgress = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const maxScroll = docHeight - winHeight;
    if (maxScroll <= 0) {
      setReadProgress(100);
      return;
    }
    setReadProgress(Math.min(100, Math.round((scrollTop / maxScroll) * 100)));
  }, []);

  useEffect(() => {
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [updateProgress]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (versionRef.current && !versionRef.current.contains(e.target as Node))
        setVersionOpen(false);
      if (chapterRef.current && !chapterRef.current.contains(e.target as Node))
        setChapterOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function readUrl(overrides: {
    book?: string;
    chapter?: number;
    chunk?: number;
    version?: string;
  }) {
    const b = encodeURIComponent(overrides.book ?? bookName);
    const c = overrides.chapter ?? chapterNumber;
    const k = overrides.chunk ?? chunkNumber;
    const v = overrides.version ?? versionAbbr;
    return `/try/bible/read?book=${b}&chapter=${c}&chunk=${k}&version=${v}`;
  }

  return (
    <div className="min-h-screen">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            onClick={() => router.back()}
            className="shrink-0 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-400"
          >
            ←
          </button>

          {/* Book + Chapter picker */}
          <div ref={chapterRef} className="relative">
            <button
              onClick={() => {
                setChapterOpen((o) => !o);
                setVersionOpen(false);
              }}
              className="rounded-md border border-gray-300 px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {bookName} {chapterNumber}
              {totalChunks > 1 && (
                <span className="ml-1 text-gray-400">
                  ({chunkNumber}/{totalChunks})
                </span>
              )}
              <span className="ml-1 text-gray-400">▾</span>
            </button>
            {chapterOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 max-h-64 w-48 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {bookName}
                </div>
                {chapterNumbers.map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      setChapterOpen(false);
                      router.push(readUrl({ chapter: num, chunk: 1 }));
                    }}
                    className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      num === chapterNumber
                        ? "font-semibold text-emerald-600"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    Chapter {num}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Bionic reading toggle */}
          <button
            onClick={toggleBionic}
            aria-label={bionic ? "Disable bionic reading" : "Enable bionic reading"}
            className={`rounded-md px-1.5 py-1 text-xs font-bold transition-colors ${
              bionic
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                : "text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            }`}
          >
            <span className="text-sm">Bionic Reading</span>
          </button>

          {/* Reading mode toggle */}
          <div className="inline-flex rounded-md bg-gray-100 p-0.5 dark:bg-gray-800">
            <button
              onClick={() => {
                setMode("study");
                setReadingMode("study");
              }}
              className={`rounded px-2 py-1 text-[0.65rem] font-semibold leading-none transition-all ${
                mode === "study"
                  ? "bg-white text-emerald-700 shadow-sm dark:bg-gray-700 dark:text-emerald-400"
                  : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              }`}
            >
              Study
            </button>
            <button
              onClick={() => {
                setMode("read");
                setReadingMode("read");
              }}
              className={`rounded px-2 py-1 text-[0.65rem] font-semibold leading-none transition-all ${
                mode === "read"
                  ? "bg-white text-emerald-700 shadow-sm dark:bg-gray-700 dark:text-emerald-400"
                  : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              }`}
            >
              Read
            </button>
          </div>

          {/* Version picker */}
          <div ref={versionRef} className="relative">
            <button
              onClick={() => {
                setVersionOpen((o) => !o);
                setChapterOpen(false);
              }}
              className="rounded-md border border-gray-300 px-2.5 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              {versionAbbr} <span className="text-gray-400">▾</span>
            </button>
            {versionOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {availableVersions.map((v) => (
                  <button
                    key={v.abbr}
                    onClick={() => {
                      setVersionOpen(false);
                      if (v.abbr !== versionAbbr) {
                        router.push(readUrl({ version: v.abbr, chunk: 1 }));
                      }
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      v.abbr === versionAbbr
                        ? "font-semibold text-emerald-600"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span className="font-medium">{v.abbr}</span>{" "}
                    <span className="text-gray-500 dark:text-gray-400">
                      {v.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mx-auto mt-2 max-w-2xl">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width] duration-100"
              style={{ width: `${readProgress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <article className="max-w-none text-lg">
            <FormattedChunkText chunkText={chunkText} bionic={bionic} />
          </article>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 py-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <button
            onClick={handleGoBack}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-400"
          >
            ← Go back
          </button>
          <button
            onClick={handleFinishReading}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 active:scale-95"
          >
            I&apos;ve finished reading ✓
          </button>
        </div>
      </footer>
    </div>
  );
}

"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  getReadingMode,
  setReadingMode,
  type ReadingMode,
} from "@/lib/reading-progress";
import {
  markChapterComplete,
  markReadingComplete,
  loadAllProgress,
} from "@/lib/progress-service";
import { Logo } from "@/components/logo";
import { FormattedChunkText, type ExplanationPassage } from "./format-chunk-text";
import { InlineQuiz, type QuizQuestion } from "./inline-quiz";
import { bibleBookSortIndex } from "@/lib/bible-book-order";

// ── Types ────────────────────────────────────────────────────

type LoadedChapter = {
  chapterNumber: number;
  chunkTexts: string[];
  questions: QuizQuestion[];
  explanations: ExplanationPassage[] | null;
};

type VersionInfo = { abbr: string; name: string };

type CompletionAge = "recent" | "fading" | "old";

function getCompletionAge(timestamp: string | undefined): CompletionAge {
  if (!timestamp) return "old";
  const days = (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 7) return "recent";
  if (days <= 30) return "fading";
  return "old";
}

// ── Icons ────────────────────────────────────────────────────

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

// ── ChapterSection ───────────────────────────────────────────

type ChapterSectionProps = {
  bookName: string;
  chapter: LoadedChapter;
  bionic: boolean;
  fontSize: number;
  mode: ReadingMode;
  onHeadingMount: (chNum: number, el: HTMLElement | null) => void;
  onReadingComplete: (chNum: number) => void;
  onNextChapter: (chNum: number) => void;
};

const ChapterSection = React.memo(function ChapterSection({
  bookName,
  chapter,
  bionic,
  fontSize,
  mode,
  onHeadingMount,
  onReadingComplete,
  onNextChapter,
}: ChapterSectionProps) {
  const { chapterNumber, chunkTexts, questions, explanations } = chapter;
  const endSentinelRef = useRef<HTMLDivElement>(null);
  const readMarkedRef = useRef(false);

  const headingCallbackRef = useCallback(
    (el: HTMLElement | null) => onHeadingMount(chapterNumber, el),
    [chapterNumber, onHeadingMount],
  );

  // Use refs for callbacks to avoid stale closures in the observer
  const onReadingCompleteRef = useRef(onReadingComplete);
  const onNextChapterRef = useRef(onNextChapter);
  const modeRef = useRef(mode);
  useEffect(() => { onReadingCompleteRef.current = onReadingComplete; }, [onReadingComplete]);
  useEffect(() => { onNextChapterRef.current = onNextChapter; }, [onNextChapter]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    const el = endSentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !readMarkedRef.current) {
          readMarkedRef.current = true;
          onReadingCompleteRef.current(chapterNumber);
          if (modeRef.current === "read") {
            onNextChapterRef.current(chapterNumber);
          }
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [chapterNumber]);

  return (
    <section className="mb-16">
      {/* Chapter heading divider */}
      <div ref={headingCallbackRef} className="mb-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        <span className="shrink-0 rounded-full bg-gray-100 px-4 py-1 text-xs font-bold uppercase tracking-widest text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          Chapter {chapterNumber}
        </span>
        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* All chunks for this chapter */}
      <article className="max-w-none" style={{ fontSize: `${fontSize}px` }}>
        {chunkTexts.map((text, i) => (
          <FormattedChunkText
            key={i}
            chunkText={text}
            bionic={bionic}
            explanations={explanations ?? undefined}
          />
        ))}
      </article>

      {/* End-of-chapter sentinel — triggers reading complete */}
      <div ref={endSentinelRef} className="h-2" />

      {/* Inline quiz (study mode only) */}
      {mode === "study" && (
        <div className="mt-8">
          <InlineQuiz
            bookName={bookName}
            chapterNumber={chapterNumber}
            questions={questions}
            onComplete={() => onNextChapter(chapterNumber)}
          />
        </div>
      )}
    </section>
  );
});

// ── ChunkReader ──────────────────────────────────────────────

type Props = {
  bookName: string;
  initialChapterNumber: number;
  initialChunkTexts: string[];
  initialQuestions: QuizQuestion[];
  initialExplanations: ExplanationPassage[] | null;
  versionAbbr: string;
  versionName: string;
  availableVersions: VersionInfo[];
  chapterNumbers: number[];
  allBookNames: string[];
};

export function ChunkReader({
  bookName,
  initialChapterNumber,
  initialChunkTexts,
  initialQuestions,
  initialExplanations,
  versionAbbr,
  availableVersions,
  chapterNumbers,
  allBookNames,
}: Props) {
  const router = useRouter();

  // Display settings
  const [dark, setDark] = useState(false);
  const [bionic, setBionic] = useState(false);
  const [mode, setMode] = useState<ReadingMode>("study");
  const [fontSize, setFontSize] = useState(18);
  const FONT_SIZE_MIN = 14;
  const FONT_SIZE_MAX = 28;
  const FONT_SIZE_STEP = 2;

  // Continuous chapter state
  const [loadedChapters, setLoadedChapters] = useState<LoadedChapter[]>([
    {
      chapterNumber: initialChapterNumber,
      chunkTexts: initialChunkTexts,
      questions: initialQuestions,
      explanations: initialExplanations,
    },
  ]);
  const [loadingNext, setLoadingNext] = useState(false);
  const [visibleChapterNumber, setVisibleChapterNumber] = useState(initialChapterNumber);

  // Track loaded chapter numbers to prevent duplicates
  const loadedChapterNums = useRef<Set<number>>(new Set([initialChapterNumber]));
  const loadingRef = useRef(false);

  // Progress for chapter strip coloring
  const [chapterTimestamps, setChapterTimestamps] = useState<Record<string, string>>({});
  const [readDone, setReadDone] = useState<Record<string, boolean>>({});
  const [quizDone, setQuizDone] = useState<Record<string, boolean>>({});

  // Dropdown state
  const [versionOpen, setVersionOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [fontSizeOpen, setFontSizeOpen] = useState(false);
  const versionRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const fontSizeRef = useRef<HTMLDivElement>(null);

  // Chapter strip
  const chapterStripRef = useRef<HTMLDivElement>(null);
  const activeChapterRef = useRef<HTMLButtonElement>(null);
  const [chapterStripJustify, setChapterStripJustify] = useState<"center" | "flex-start">("center");

  // Chapter heading elements for scroll detection
  const headingRefs = useRef<Map<number, HTMLElement>>(new Map());

  const sortedBooks = [...allBookNames].sort(
    (a, b) => bibleBookSortIndex(a) - bibleBookSortIndex(b),
  );

  // ── Init ──────────────────────────────────────────────────

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setBionic(localStorage.getItem("bionic") === "true");
    setMode(getReadingMode());
    const saved = localStorage.getItem("bibleFontSize");
    if (saved) {
      const n = parseInt(saved, 10);
      if (n >= FONT_SIZE_MIN && n <= FONT_SIZE_MAX) setFontSize(n);
    }
  }, []);

  useEffect(() => {
    loadAllProgress().then(({ read, quiz, timestamps }) => {
      setReadDone(read);
      setQuizDone(quiz);
      setChapterTimestamps(timestamps);
    });
  }, []);

  // ── Scroll detection for visible chapter ─────────────────

  useEffect(() => {
    function onScroll() {
      let best: number | null = null;
      for (const [chNum, el] of headingRefs.current) {
        const top = el.getBoundingClientRect().top;
        if (top <= 120) best = chNum;
      }
      if (best !== null && best !== visibleChapterNumber) {
        setVisibleChapterNumber(best);
        const url = new URL(window.location.href);
        url.searchParams.set("chapter", String(best));
        url.searchParams.delete("chunk");
        window.history.replaceState({}, "", url.toString());
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [visibleChapterNumber]);

  // ── Chapter strip ─────────────────────────────────────────

  const updateChapterStripJustify = useCallback(() => {
    const node = chapterStripRef.current;
    if (!node) return;
    setChapterStripJustify(node.scrollWidth > node.clientWidth ? "flex-start" : "center");
  }, []);

  useLayoutEffect(() => {
    updateChapterStripJustify();
    const node = chapterStripRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => updateChapterStripJustify());
    ro.observe(node);
    return () => ro.disconnect();
  }, [bookName, chapterNumbers, chapterTimestamps, mode, quizDone, readDone, updateChapterStripJustify]);

  useEffect(() => {
    const el = activeChapterRef.current;
    const container = chapterStripRef.current;
    if (!container) return;
    if (visibleChapterNumber <= 5) {
      container.scrollLeft = 0;
    } else if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [visibleChapterNumber, chapterStripJustify]);

  // ── Close dropdowns on outside click ─────────────────────

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (versionRef.current && !versionRef.current.contains(e.target as Node)) setVersionOpen(false);
      if (bookRef.current && !bookRef.current.contains(e.target as Node)) setBookOpen(false);
      if (fontSizeRef.current && !fontSizeRef.current.contains(e.target as Node)) setFontSizeOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Display toggles ───────────────────────────────────────

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

  function changeFontSize(delta: number) {
    setFontSize((prev) => {
      const next = Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, prev + delta));
      localStorage.setItem("bibleFontSize", String(next));
      return next;
    });
  }

  // ── URL helpers ───────────────────────────────────────────

  function readUrl(overrides: { book?: string; chapter?: number; version?: string }) {
    const b = encodeURIComponent(overrides.book ?? bookName);
    const c = overrides.chapter ?? initialChapterNumber;
    const v = overrides.version ?? versionAbbr;
    return `/try/bible/read?book=${b}&chapter=${c}&version=${v}`;
  }

  // ── Chapter loading ───────────────────────────────────────

  const loadNextChapter = useCallback(
    async (afterChapterNumber: number) => {
      if (loadingRef.current) return;
      const idx = chapterNumbers.indexOf(afterChapterNumber);
      const nextNum = chapterNumbers[idx + 1];
      if (nextNum === undefined) return;
      if (loadedChapterNums.current.has(nextNum)) return;

      loadingRef.current = true;
      loadedChapterNums.current.add(nextNum);
      setLoadingNext(true);

      try {
        const res = await fetch(
          `/api/chapter?book=${encodeURIComponent(bookName)}&chapter=${nextNum}&version=${versionAbbr}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        setLoadedChapters((prev) => [
          ...prev,
          {
            chapterNumber: nextNum,
            chunkTexts: data.chunks ?? [],
            questions: data.questions ?? [],
            explanations: data.explanations ?? null,
          },
        ]);
      } finally {
        loadingRef.current = false;
        setLoadingNext(false);
      }
    },
    [bookName, chapterNumbers, versionAbbr],
  );

  // ── Chapter section callbacks ─────────────────────────────

  const handleHeadingMount = useCallback((chNum: number, el: HTMLElement | null) => {
    if (el) headingRefs.current.set(chNum, el);
    else headingRefs.current.delete(chNum);
  }, []);

  const handleReadingComplete = useCallback(
    (chNum: number) => {
      void markReadingComplete(bookName, chNum);
      setReadDone((prev) => ({ ...prev, [`${bookName}:${chNum}`]: true }));
    },
    [bookName],
  );

  const handleReadModeChapterComplete = useCallback(
    (chNum: number) => {
      void markChapterComplete(bookName, chNum);
      setReadDone((prev) => ({ ...prev, [`${bookName}:${chNum}`]: true }));
      setQuizDone((prev) => ({ ...prev, [`${bookName}:${chNum}`]: true }));
      void loadNextChapter(chNum);
    },
    [bookName, loadNextChapter],
  );

  const handleStudyModeQuizComplete = useCallback(
    (chNum: number) => {
      setQuizDone((prev) => ({ ...prev, [`${bookName}:${chNum}`]: true }));
      void loadNextChapter(chNum);
    },
    [bookName, loadNextChapter],
  );

  // Route the onReadingComplete and onNextChapter to the right handlers
  const handleReadingCompleteForSection = useCallback(
    (chNum: number) => {
      if (mode === "read") {
        handleReadModeChapterComplete(chNum);
      } else {
        handleReadingComplete(chNum);
      }
    },
    [mode, handleReadModeChapterComplete, handleReadingComplete],
  );

  const handleNextChapterForSection = useCallback(
    (chNum: number) => {
      if (mode === "study") {
        handleStudyModeQuizComplete(chNum);
      }
      // read mode is handled in handleReadingCompleteForSection
    },
    [mode, handleStudyModeQuizComplete],
  );

  // ── Chapter strip helpers ─────────────────────────────────

  function isChapterDone(chNum: number): boolean {
    const key = `${bookName}:${chNum}`;
    if (mode === "read") return !!readDone[key];
    return !!readDone[key] && !!quizDone[key];
  }

  function getChapterButtonStyle(chNum: number): string {
    const isCurrent = chNum === visibleChapterNumber;
    const isCompleted = isChapterDone(chNum);

    if (isCurrent) {
      return "bg-emerald-500 text-white ring-2 ring-emerald-400 shadow-sm font-bold";
    }
    if (isCompleted) {
      const age = getCompletionAge(chapterTimestamps[`${bookName}:${chNum}`]);
      if (age === "recent")
        return "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-300 font-semibold dark:bg-emerald-600 dark:text-white dark:ring-emerald-500";
      if (age === "fading")
        return "bg-emerald-50 text-emerald-600/60 ring-1 ring-inset ring-emerald-200 font-semibold dark:bg-emerald-800 dark:text-emerald-100 dark:ring-emerald-700";
      return "bg-emerald-50/60 text-emerald-500/50 ring-1 ring-inset ring-emerald-200/60 font-semibold dark:bg-emerald-900 dark:text-emerald-200 dark:ring-emerald-800";
    }
    return "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700";
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="min-h-screen">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/95">
        {/* Controls row */}
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Logo compact />
          <div className="h-4 w-px shrink-0 bg-gray-200 dark:bg-gray-600" />
          <button
            onClick={() => router.back()}
            className="shrink-0 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-400"
          >
            ←
          </button>

          {/* Book selector */}
          <div ref={bookRef} className="relative">
            <button
              onClick={() => {
                setBookOpen((o) => !o);
                setVersionOpen(false);
                setFontSizeOpen(false);
              }}
              className="rounded-md border border-gray-300 px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {bookName}
              <span className="ml-1 text-gray-400">▾</span>
            </button>
            {bookOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 max-h-64 w-44 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {sortedBooks.map((name) => (
                  <button
                    key={name}
                    onClick={() => {
                      setBookOpen(false);
                      router.push(readUrl({ book: name, chapter: 1 }));
                    }}
                    className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      name === bookName
                        ? "font-semibold text-emerald-600"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* Font size */}
          <div ref={fontSizeRef} className="relative">
            <button
              onClick={() => {
                setFontSizeOpen((o) => !o);
                setVersionOpen(false);
                setBookOpen(false);
              }}
              aria-label="Adjust font size"
              className="rounded-md p-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              Aa
            </button>
            {fontSizeOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <button
                  onClick={() => changeFontSize(-FONT_SIZE_STEP)}
                  disabled={fontSize <= FONT_SIZE_MIN}
                  aria-label="Decrease font size"
                  className="flex h-7 w-7 items-center justify-center rounded text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  −
                </button>
                <span className="min-w-[3ch] text-center text-xs font-semibold tabular-nums text-gray-700 dark:text-gray-200">
                  {fontSize}
                </span>
                <button
                  onClick={() => changeFontSize(FONT_SIZE_STEP)}
                  disabled={fontSize >= FONT_SIZE_MAX}
                  aria-label="Increase font size"
                  className="flex h-7 w-7 items-center justify-center rounded text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  +
                </button>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Bionic reading */}
          <button
            onClick={toggleBionic}
            aria-label={bionic ? "Disable bionic reading" : "Enable bionic reading"}
            className={`rounded-md px-1.5 py-1 text-xs font-bold transition-colors ${
              bionic
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                : "text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            }`}
          >
            <span className="text-sm">B</span>
          </button>

          {/* Reading mode toggle */}
          <div className="inline-flex rounded-md bg-gray-100 p-0.5 dark:bg-gray-800">
            <button
              onClick={() => { setMode("study"); setReadingMode("study"); }}
              className={`rounded px-2 py-1 text-[0.65rem] font-semibold leading-none transition-all ${
                mode === "study"
                  ? "bg-white text-emerald-700 shadow-sm dark:bg-gray-700 dark:text-emerald-400"
                  : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              }`}
            >
              Study
            </button>
            <button
              onClick={() => { setMode("read"); setReadingMode("read"); }}
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
                setBookOpen(false);
                setFontSizeOpen(false);
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
                        router.push(readUrl({ version: v.abbr }));
                      }
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      v.abbr === versionAbbr
                        ? "font-semibold text-emerald-600"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span className="font-medium">{v.abbr}</span>{" "}
                    <span className="text-gray-500 dark:text-gray-400">{v.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chapter strip */}
        <div
          ref={chapterStripRef}
          style={{
            display: "flex",
            flexWrap: "nowrap",
            overflowX: "auto",
            gap: "4px",
            marginTop: "8px",
            paddingTop: "8px",
            paddingBottom: "2px",
            marginLeft: "-16px",
            marginRight: "-16px",
            paddingLeft: "16px",
            paddingRight: "16px",
            justifyContent: chapterStripJustify,
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          } as React.CSSProperties}
        >
          {chapterNumbers.map((num) => (
            <button
              key={num}
              ref={num === visibleChapterNumber ? activeChapterRef : undefined}
              onClick={() => router.push(readUrl({ chapter: num }))}
              style={{ flexShrink: 0, width: "28px", height: "28px" }}
              className={`flex items-center justify-center rounded text-xs transition-all ${getChapterButtonStyle(num)}`}
            >
              {num}
            </button>
          ))}
        </div>
      </header>

      {/* Continuous chapter content */}
      <div className="px-4 py-10">
        <div className="mx-auto max-w-2xl">
          {loadedChapters.map((ch) => (
            <ChapterSection
              key={ch.chapterNumber}
              bookName={bookName}
              chapter={ch}
              bionic={bionic}
              fontSize={fontSize}
              mode={mode}
              onHeadingMount={handleHeadingMount}
              onReadingComplete={handleReadingCompleteForSection}
              onNextChapter={handleNextChapterForSection}
            />
          ))}

          {/* Loading indicator */}
          {loadingNext && (
            <div className="flex items-center justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          )}

          {/* End of book */}
          {!loadingNext &&
            loadedChapters.length > 0 &&
            chapterNumbers.indexOf(
              loadedChapters[loadedChapters.length - 1].chapterNumber,
            ) === chapterNumbers.length - 1 && (
              <div className="py-10 text-center">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  End of {bookName}
                </p>
                <button
                  onClick={() => router.push("/try/bible/start")}
                  className="mt-4 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                >
                  Back to Roadmap →
                </button>
              </div>
            )}
        </div>
      </div>

      <footer className="border-t border-gray-200 py-6 dark:border-gray-700">
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          Feedback?{" "}
          <a
            href="mailto:readablebibleapp@gmail.com"
            className="underline hover:text-gray-600 dark:hover:text-gray-400"
          >
            readablebibleapp@gmail.com
          </a>
        </p>
      </footer>
    </div>
  );
}

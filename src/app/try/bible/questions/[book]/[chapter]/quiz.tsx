"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { markQuizComplete } from "@/lib/progress-service";

type Question = {
  id: string;
  type: "multiple_choice" | "true_false" | "fill_blank";
  question: string;
  options?: string[];
  answer: string;
  verse_reference: string;
};

type Props = {
  bookName: string;
  chapterNumber: number;
  questions: Question[];
  chapterNumbers: number[];
  versionAbbr: string;
};

function normalize(s: string) {
  return s.toLowerCase().trim();
}

export function Quiz({
  bookName,
  chapterNumber,
  questions,
  chapterNumbers,
  versionAbbr,
}: Props) {
  const [activeQuestions, setActiveQuestions] = useState<Question[]>(questions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [fillInput, setFillInput] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [missedInRound, setMissedInRound] = useState<Question[]>([]);
  const [phase, setPhase] = useState<"questions" | "review" | "complete">(
    questions.length === 0 ? "complete" : "questions",
  );

  useEffect(() => {
    console.log(
      `[Quiz] book="${bookName}" chapter=${chapterNumber} questions=${questions.length}`,
    );
    if (questions.length === 0) {
      console.warn(`[Quiz] No questions for "${bookName}" ch.${chapterNumber} — skipping to complete`);
      void markQuizComplete(bookName, chapterNumber);
    }
  }, [bookName, chapterNumber, questions.length]);

  const roundTotal = activeQuestions.length;
  const current = roundTotal > 0 ? activeQuestions[currentIndex] : null;

  function isCorrect(answer: string) {
    return current !== null && normalize(answer) === normalize(current.answer);
  }

  function handleSelect(answer: string) {
    if (showFeedback) return;
    setSelectedAnswer(answer);
    setShowFeedback(true);
    if (isCorrect(answer)) {
      setRoundCorrect((s) => s + 1);
    } else {
      setMissedInRound((prev) => [...prev, current!]);
    }
  }

  function handleFillSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (showFeedback || !fillInput.trim()) return;
    handleSelect(fillInput.trim());
  }

  async function handleNext() {
    if (currentIndex < roundTotal - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setFillInput("");
      setShowFeedback(false);
    } else if (missedInRound.length > 0) {
      setPhase("review");
    } else {
      await markQuizComplete(bookName, chapterNumber);
      setPhase("complete");
    }
  }

  function handleRetry() {
    setActiveQuestions(missedInRound);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setFillInput("");
    setShowFeedback(false);
    setRoundCorrect(0);
    setMissedInRound([]);
    setPhase("questions");
  }

  function readChapterUrl() {
    return `/try/bible/read?book=${encodeURIComponent(bookName)}&chapter=${chapterNumber}&chunk=1&version=${versionAbbr}`;
  }

  function getNextChapterUrl(): string | null {
    const idx = chapterNumbers.indexOf(chapterNumber);
    const next = chapterNumbers[idx + 1];
    if (next !== undefined) {
      return `/try/bible/read?book=${encodeURIComponent(bookName)}&chapter=${next}&chunk=1&version=${versionAbbr}`;
    }
    return null;
  }

  const nextUrl = getNextChapterUrl();

  // ── Review Screen (got some wrong) ─────────────────────────

  if (phase === "review") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-gray-900">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/30">
            <span className="text-4xl font-bold text-amber-600 dark:text-amber-400">
              {roundCorrect}/{roundTotal}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            You got {roundCorrect}/{roundTotal} — review and retry!
          </h1>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            {missedInRound.length === 1
              ? "1 question needs another look."
              : `${missedInRound.length} questions need another look.`}
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={handleRetry}
              className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              Retry Questions →
            </button>
            <Link
              href={readChapterUrl()}
              className="rounded-lg border-2 border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-800"
            >
              Re-read Chapter
            </Link>
            <Link
              href="/try/bible/start"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Back to Roadmap
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Completion Screen ──────────────────────────────────────

  if (phase === "complete") {
    const originalTotal = questions.length;
    let message: string;
    if (originalTotal === 0)
      message = "You've completed this chapter's reading.";
    else message = "Perfect — every question answered correctly!";

    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-gray-900">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30">
            {originalTotal > 0 ? (
              <svg
                className="h-14 w-14 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="h-12 w-12 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {bookName} {chapterNumber} Complete!
          </h1>
          <p className="mt-3 text-gray-500 dark:text-gray-400">{message}</p>

          <div className="mt-8 flex flex-col gap-3">
            {nextUrl ? (
              <Link
                href={nextUrl}
                className="inline-block rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                Next Chapter →
              </Link>
            ) : (
              <Link
                href="/try/bible/start"
                className="inline-block rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                Back to Roadmap
              </Link>
            )}
            <Link
              href={readChapterUrl()}
              className="inline-block rounded-lg border-2 border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-800"
            >
              Re-read Chapter
            </Link>
            {nextUrl && (
              <Link
                href="/try/bible/start"
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Back to Roadmap
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Question Screen ────────────────────────────────────────

  if (!current) return null;

  const wasCorrect = selectedAnswer !== null && isCorrect(selectedAnswer);

  function optionClasses(option: string): string {
    const base =
      "w-full rounded-xl border-2 px-4 py-3.5 text-left text-sm font-medium transition-all ";
    if (!showFeedback) {
      return (
        base +
        "border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 active:scale-[0.98] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-emerald-600 dark:hover:bg-emerald-900/20"
      );
    }
    if (normalize(option) === normalize(current!.answer)) {
      return (
        base +
        "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-400"
      );
    }
    if (option === selectedAnswer) {
      return (
        base +
        "border-red-400 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-900/30 dark:text-red-400"
      );
    }
    return (
      base +
      "border-gray-100 bg-gray-50 text-gray-400 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-600"
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between">
            <Link
              href="/try/bible/start"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              ←
            </Link>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {bookName} {chapterNumber}
            </span>
            <span className="text-sm tabular-nums text-gray-500 dark:text-gray-400">
              {currentIndex + 1}/{roundTotal}
            </span>
          </div>
          {/* Segmented progress */}
          <div className="mt-2.5 flex gap-1.5">
            {activeQuestions.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  i < currentIndex
                    ? "bg-emerald-500"
                    : i === currentIndex
                      ? "bg-emerald-400 dark:bg-emerald-500"
                      : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Question body */}
      <div className="px-4 py-8" key={current.id}>
        <div className="mx-auto max-w-2xl">
          <span className="mb-4 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            {current.type === "multiple_choice"
              ? "Multiple Choice"
              : current.type === "true_false"
                ? "True or False"
                : "Fill in the Blank"}
          </span>

          <h2 className="text-xl font-semibold leading-relaxed text-gray-900 dark:text-white">
            {current.question}
          </h2>

          {/* Answer options */}
          <div className="mt-6 space-y-3">
            {current.type === "multiple_choice" &&
              current.options?.map((option) => (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  disabled={showFeedback}
                  className={optionClasses(option)}
                >
                  {option}
                </button>
              ))}

            {current.type === "true_false" &&
              ["True", "False"].map((option) => (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  disabled={showFeedback}
                  className={optionClasses(option)}
                >
                  {option}
                </button>
              ))}

            {current.type === "fill_blank" && (
              <form onSubmit={handleFillSubmit} className="space-y-3">
                <input
                  type="text"
                  value={fillInput}
                  onChange={(e) => setFillInput(e.target.value)}
                  disabled={showFeedback}
                  placeholder="Type your answer…"
                  autoFocus
                  className={`w-full rounded-xl border-2 px-4 py-3.5 text-sm font-medium outline-none transition-all placeholder:text-gray-400 ${
                    !showFeedback
                      ? "border-gray-200 bg-white text-gray-700 focus:border-emerald-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:placeholder:text-gray-600 dark:focus:border-emerald-500"
                      : wasCorrect
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "border-red-400 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                />
                {!showFeedback && (
                  <button
                    type="submit"
                    disabled={!fillInput.trim()}
                    className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Submit
                  </button>
                )}
              </form>
            )}
          </div>

          {/* Feedback panel */}
          {showFeedback && (
            <div
              className={`mt-6 rounded-xl border p-4 ${
                wasCorrect
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
                  : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
              }`}
            >
              <p
                className={`text-sm font-bold ${
                  wasCorrect
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-red-700 dark:text-red-400"
                }`}
              >
                {wasCorrect ? "✓ Correct!" : "✗ Incorrect"}
              </p>
              {!wasCorrect && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  The correct answer is{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {current.answer}
                  </span>
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {current.verse_reference}
              </p>

              <button
                onClick={handleNext}
                className="mt-4 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 active:scale-[0.98]"
              >
                {currentIndex < roundTotal - 1 ? "Next Question →" : "See Results"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

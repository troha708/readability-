"use client";

import { useState } from "react";
import { markQuizComplete } from "@/lib/progress-service";

export type QuizQuestion = {
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
  questions: QuizQuestion[];
  onComplete: () => void;
};

function normalize(s: string) {
  return s.toLowerCase().trim();
}

export function InlineQuiz({ bookName, chapterNumber, questions, onComplete }: Props) {
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>(questions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [fillInput, setFillInput] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [missedInRound, setMissedInRound] = useState<QuizQuestion[]>([]);
  const [phase, setPhase] = useState<"questions" | "review" | "complete">("questions");

  const roundTotal = activeQuestions.length;
  const current = roundTotal > 0 ? activeQuestions[currentIndex] : null;

  // No questions — show simple completion card
  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-800 dark:bg-emerald-900/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-800">
              <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              Chapter {chapterNumber} complete!
            </p>
          </div>
          <button
            onClick={() => {
              void markQuizComplete(bookName, chapterNumber);
              onComplete();
            }}
            className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

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

  // ── Complete ───────────────────────────────────────────────

  if (phase === "complete") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-800 dark:bg-emerald-900/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-800">
              <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                Chapter {chapterNumber} complete!
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500">
                All questions answered correctly.
              </p>
            </div>
          </div>
          <button
            onClick={onComplete}
            className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // ── Review (some wrong) ────────────────────────────────────

  if (phase === "review") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-800 dark:bg-amber-900/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-800">
              <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                {roundCorrect}/{roundTotal}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {missedInRound.length === 1 ? "1 question" : `${missedInRound.length} questions`} to review
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500">
                Got {roundCorrect} of {roundTotal} right
              </p>
            </div>
          </div>
          <button
            onClick={handleRetry}
            className="shrink-0 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
          >
            Retry →
          </button>
        </div>
      </div>
    );
  }

  // ── Question ───────────────────────────────────────────────

  if (!current) return null;

  const wasCorrect = selectedAnswer !== null && isCorrect(selectedAnswer);

  function optionClasses(option: string): string {
    const base = "w-full rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all ";
    if (!showFeedback) {
      return base + "border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 active:scale-[0.98] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-emerald-600 dark:hover:bg-emerald-900/20";
    }
    if (normalize(option) === normalize(current!.answer)) {
      return base + "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-400";
    }
    if (option === selectedAnswer) {
      return base + "border-red-400 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-900/30 dark:text-red-400";
    }
    return base + "border-gray-100 bg-gray-50 text-gray-400 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-600";
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40">
      {/* Quiz header */}
      <div className="border-b border-gray-200 px-5 py-3 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Chapter {chapterNumber} Quiz
          </span>
          <span className="text-xs tabular-nums text-gray-400 dark:text-gray-500">
            {currentIndex + 1} / {roundTotal}
          </span>
        </div>
        <div className="mt-2 flex gap-1">
          {activeQuestions.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
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

      {/* Question body */}
      <div className="p-5" key={current.id}>
        <span className="mb-3 inline-block rounded-full bg-gray-200 px-3 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
          {current.type === "multiple_choice"
            ? "Multiple Choice"
            : current.type === "true_false"
              ? "True or False"
              : "Fill in the Blank"}
        </span>

        <p className="mb-4 text-base font-medium leading-relaxed text-gray-900 dark:text-white">
          {current.question}
        </p>

        <div className="space-y-2">
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
            <form onSubmit={handleFillSubmit} className="space-y-2">
              <input
                type="text"
                value={fillInput}
                onChange={(e) => setFillInput(e.target.value)}
                disabled={showFeedback}
                placeholder="Type your answer…"
                autoFocus
                className={`w-full rounded-xl border-2 px-4 py-3 text-sm font-medium outline-none transition-all placeholder:text-gray-400 ${
                  !showFeedback
                    ? "border-gray-200 bg-white text-gray-700 focus:border-emerald-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:focus:border-emerald-500"
                    : wasCorrect
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "border-red-400 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-900/30 dark:text-red-400"
                }`}
              />
              {!showFeedback && (
                <button
                  type="submit"
                  disabled={!fillInput.trim()}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Submit
                </button>
              )}
            </form>
          )}
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div
            className={`mt-4 rounded-xl border p-4 ${
              wasCorrect
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
                : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
            }`}
          >
            <p className={`text-sm font-bold ${wasCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
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
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {current.verse_reference}
            </p>
            <button
              onClick={handleNext}
              className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 active:scale-[0.98]"
            >
              {currentIndex < roundTotal - 1 ? "Next Question →" : "See Results"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

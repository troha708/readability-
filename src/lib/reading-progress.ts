const READ_KEY = "bible-reading-progress";
const QUIZ_KEY = "bible-quiz-progress";
const MODE_KEY = "bible-reading-mode";
const DATES_KEY = "bible-completion-dates";

export type ReadingProgress = Record<string, boolean>;
export type ReadingMode = "study" | "read";
export type StreakInfo = { streak: number; completedToday: boolean };

// ── Date / streak helpers ────────────────────────────────────

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function yesterdayDateStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getCompletionDates(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function recordCompletionDate(): void {
  const dates = getCompletionDates();
  const today = todayDateStr();
  if (!dates.includes(today)) {
    dates.push(today);
    localStorage.setItem(DATES_KEY, JSON.stringify(dates));
  }
}

export function getStreakInfo(): StreakInfo {
  const dates = getCompletionDates();
  if (dates.length === 0) return { streak: 0, completedToday: false };

  const unique = [...new Set(dates)].sort();
  const today = todayDateStr();
  const completedToday = unique.includes(today);

  const startDate = completedToday ? today : yesterdayDateStr();
  if (!unique.includes(startDate)) return { streak: 0, completedToday };

  let streak = 1;
  let cursor = new Date(startDate + "T00:00:00");
  for (;;) {
    cursor.setDate(cursor.getDate() - 1);
    const prev = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if (unique.includes(prev)) streak++;
    else break;
  }
  return { streak, completedToday };
}

// ── Migration: seed quiz progress from legacy unified key ────

function ensureQuizMigration(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(QUIZ_KEY) !== null) return;
  const read = getReadProgress();
  localStorage.setItem(QUIZ_KEY, JSON.stringify(read));
}

// ── Read / Quiz progress ─────────────────────────────────────

export function getReadProgress(): ReadingProgress {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(READ_KEY) || "{}");
  } catch {
    return {};
  }
}

export function getQuizProgress(): ReadingProgress {
  if (typeof window === "undefined") return {};
  ensureQuizMigration();
  try {
    return JSON.parse(localStorage.getItem(QUIZ_KEY) || "{}");
  } catch {
    return {};
  }
}

export function markReadingComplete(book: string, chapter: number): void {
  const progress = getReadProgress();
  progress[`${book}:${chapter}`] = true;
  localStorage.setItem(READ_KEY, JSON.stringify(progress));
}

export function markQuizComplete(book: string, chapter: number): void {
  ensureQuizMigration();
  const progress = getQuizProgress();
  const key = `${book}:${chapter}`;
  const alreadyDone = !!progress[key];
  progress[key] = true;
  localStorage.setItem(QUIZ_KEY, JSON.stringify(progress));
  if (!alreadyDone) recordCompletionDate();
}

/** Read-mode shorthand: marks reading done + records streak date. */
export function markChapterComplete(book: string, chapter: number): void {
  const alreadyDone = !!getReadProgress()[`${book}:${chapter}`];
  markReadingComplete(book, chapter);
  if (!alreadyDone) recordCompletionDate();
}

export function isChapterComplete(book: string, chapter: number): boolean {
  return !!getReadProgress()[`${book}:${chapter}`];
}

// ── Reading mode ─────────────────────────────────────────────

export function getReadingMode(): ReadingMode {
  if (typeof window === "undefined") return "study";
  return localStorage.getItem(MODE_KEY) === "read" ? "read" : "study";
}

export function setReadingMode(mode: ReadingMode): void {
  localStorage.setItem(MODE_KEY, mode);
}

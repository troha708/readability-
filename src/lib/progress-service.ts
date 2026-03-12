import { createClient } from "@/lib/supabase/client";
import type { ReadingProgress, StreakInfo } from "./reading-progress";

const READ_KEY = "bible-reading-progress";
const QUIZ_KEY = "bible-quiz-progress";
const DATES_KEY = "bible-completion-dates";
const MIGRATED_PREFIX = "bible-progress-migrated:";

// ── localStorage helpers ────────────────────────────────────

function getLocalProgress(key: string): ReadingProgress {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}

function setLocalProgress(key: string, progress: ReadingProgress): void {
  localStorage.setItem(key, JSON.stringify(progress));
}

function getLocalQuizProgress(): ReadingProgress {
  if (typeof window === "undefined") return {};
  if (localStorage.getItem(QUIZ_KEY) === null) {
    const read = getLocalProgress(READ_KEY);
    localStorage.setItem(QUIZ_KEY, JSON.stringify(read));
    return { ...read };
  }
  return getLocalProgress(QUIZ_KEY);
}

function getLocalDates(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DATES_KEY) || "[]");
  } catch {
    return [];
  }
}

function recordLocalDate(): void {
  const dates = getLocalDates();
  const today = todayStr();
  if (!dates.includes(today)) {
    dates.push(today);
    localStorage.setItem(DATES_KEY, JSON.stringify(dates));
  }
}

// ── Date helpers ────────────────────────────────────────────

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Auth ────────────────────────────────────────────────────

async function getUserId(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

// ── Supabase reads ──────────────────────────────────────────

async function fetchSupabaseProgress(
  userId: string,
): Promise<{ read: ReadingProgress; quiz: ReadingProgress }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_progress")
    .select("book, chapter, reading_complete, quiz_complete")
    .eq("user_id", userId);

  if (error) throw error;

  const read: ReadingProgress = {};
  const quiz: ReadingProgress = {};
  for (const row of data ?? []) {
    const key = `${row.book}:${row.chapter}`;
    if (row.reading_complete) read[key] = true;
    if (row.quiz_complete) quiz[key] = true;
  }
  return { read, quiz };
}

// ── Supabase writes ─────────────────────────────────────────

async function setProgressField(
  userId: string,
  book: string,
  chapter: number,
  field: "reading_complete" | "quiz_complete",
  completedAt: string | null,
): Promise<void> {
  const supabase = createClient();

  const { data: current } = await supabase
    .from("user_progress")
    .select("reading_complete, quiz_complete, completed_at")
    .eq("user_id", userId)
    .eq("book", book)
    .eq("chapter", chapter)
    .maybeSingle();

  const merged = {
    reading_complete:
      field === "reading_complete" ? true : (current?.reading_complete ?? false),
    quiz_complete:
      field === "quiz_complete" ? true : (current?.quiz_complete ?? false),
    completed_at: completedAt ?? current?.completed_at ?? null,
  };

  if (current) {
    await supabase
      .from("user_progress")
      .update(merged)
      .eq("user_id", userId)
      .eq("book", book)
      .eq("chapter", chapter);
  } else {
    await supabase
      .from("user_progress")
      .insert({ user_id: userId, book, chapter, ...merged });
  }
}

// ── Migration: localStorage → Supabase on first login ──────

async function migrateLocalProgress(userId: string): Promise<void> {
  const flag = `${MIGRATED_PREFIX}${userId}`;
  if (typeof window === "undefined" || localStorage.getItem(flag)) return;

  const localRead = getLocalProgress(READ_KEY);
  const localQuiz = getLocalQuizProgress();
  const allKeys = new Set([
    ...Object.keys(localRead),
    ...Object.keys(localQuiz),
  ]);

  if (allKeys.size === 0) {
    localStorage.setItem(flag, "true");
    return;
  }

  const supabase = createClient();
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("user_progress")
    .select("book, chapter, reading_complete, quiz_complete, completed_at")
    .eq("user_id", userId);

  const existingMap = new Map<
    string,
    { reading_complete: boolean; quiz_complete: boolean; completed_at: string | null }
  >();
  for (const row of existing ?? []) {
    existingMap.set(`${row.book}:${row.chapter}`, row);
  }

  const rows = [];
  for (const key of allKeys) {
    const [book, chapterStr] = key.split(":");
    const chapter = parseInt(chapterStr, 10);
    const ex = existingMap.get(key);
    rows.push({
      user_id: userId,
      book,
      chapter,
      reading_complete: !!localRead[key] || (ex?.reading_complete ?? false),
      quiz_complete: !!localQuiz[key] || (ex?.quiz_complete ?? false),
      completed_at: ex?.completed_at ?? now,
    });
  }

  if (rows.length > 0) {
    const { error } = await supabase
      .from("user_progress")
      .upsert(rows, { onConflict: "user_id,book,chapter" });
    if (error) throw error;
  }

  localStorage.setItem(flag, "true");
}

// ── Public API ──────────────────────────────────────────────

/**
 * Load all reading and quiz progress. For logged-in users, migrates
 * localStorage data to Supabase on first call, then reads from Supabase.
 */
export async function loadAllProgress(): Promise<{
  read: ReadingProgress;
  quiz: ReadingProgress;
}> {
  const userId = await getUserId();
  if (!userId) {
    return {
      read: getLocalProgress(READ_KEY),
      quiz: getLocalQuizProgress(),
    };
  }

  try {
    await migrateLocalProgress(userId);
    return await fetchSupabaseProgress(userId);
  } catch {
    return {
      read: getLocalProgress(READ_KEY),
      quiz: getLocalQuizProgress(),
    };
  }
}

export async function markReadingComplete(
  book: string,
  chapter: number,
): Promise<void> {
  const local = getLocalProgress(READ_KEY);
  local[`${book}:${chapter}`] = true;
  setLocalProgress(READ_KEY, local);

  const userId = await getUserId();
  if (userId) {
    try {
      await setProgressField(userId, book, chapter, "reading_complete", null);
    } catch {
      /* Supabase write failed — localStorage has the data */
    }
  }
}

export async function markQuizComplete(
  book: string,
  chapter: number,
): Promise<void> {
  const key = `${book}:${chapter}`;
  const local = getLocalQuizProgress();
  const alreadyDone = !!local[key];
  local[key] = true;
  setLocalProgress(QUIZ_KEY, local);
  if (!alreadyDone) recordLocalDate();

  const userId = await getUserId();
  if (userId) {
    try {
      await setProgressField(
        userId,
        book,
        chapter,
        "quiz_complete",
        alreadyDone ? null : new Date().toISOString(),
      );
    } catch {
      /* Supabase write failed — localStorage has the data */
    }
  }
}

/** Read-mode shorthand: marks reading done and records a streak date. */
export async function markChapterComplete(
  book: string,
  chapter: number,
): Promise<void> {
  const key = `${book}:${chapter}`;
  const local = getLocalProgress(READ_KEY);
  const alreadyDone = !!local[key];
  local[key] = true;
  setLocalProgress(READ_KEY, local);
  if (!alreadyDone) recordLocalDate();

  const userId = await getUserId();
  if (userId) {
    try {
      await setProgressField(
        userId,
        book,
        chapter,
        "reading_complete",
        alreadyDone ? null : new Date().toISOString(),
      );
    } catch {
      /* Supabase write failed — localStorage has the data */
    }
  }
}

/** Streak info derived from local completion dates. */
export function getStreakInfo(): StreakInfo {
  const dates = getLocalDates();
  if (dates.length === 0) return { streak: 0, completedToday: false };

  const unique = [...new Set(dates)].sort();
  const today = todayStr();
  const completedToday = unique.includes(today);

  const startDate = completedToday ? today : yesterdayStr();
  if (!unique.includes(startDate)) return { streak: 0, completedToday };

  let streak = 1;
  const cursor = new Date(startDate + "T00:00:00");
  for (;;) {
    cursor.setDate(cursor.getDate() - 1);
    const prev = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if (unique.includes(prev)) streak++;
    else break;
  }
  return { streak, completedToday };
}

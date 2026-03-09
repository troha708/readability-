const STORAGE_KEY = "bible-reading-progress";
const MODE_KEY = "bible-reading-mode";

export type ReadingProgress = Record<string, boolean>;
export type ReadingMode = "study" | "read";

export function getProgress(): ReadingProgress {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function isChapterComplete(book: string, chapter: number): boolean {
  return !!getProgress()[`${book}:${chapter}`];
}

export function markChapterComplete(book: string, chapter: number): void {
  const progress = getProgress();
  progress[`${book}:${chapter}`] = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function getReadingMode(): ReadingMode {
  if (typeof window === "undefined") return "study";
  return localStorage.getItem(MODE_KEY) === "read" ? "read" : "study";
}

export function setReadingMode(mode: ReadingMode): void {
  localStorage.setItem(MODE_KEY, mode);
}

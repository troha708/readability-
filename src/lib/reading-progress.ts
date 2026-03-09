const STORAGE_KEY = "bible-reading-progress";

export type ReadingProgress = Record<string, boolean>;

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

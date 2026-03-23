/** Protestant canon + NT reading order used by roadmap and reader UI. */

export const OT_BOOK_ORDER = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
  "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles",
  "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
  "Ecclesiastes", "Song Of Solomon", "Isaiah", "Jeremiah",
  "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah",
  "Haggai", "Zechariah", "Malachi",
] as const;

export const NT_READING_ORDER = [
  "John", "Acts", "Luke", "Mark", "Matthew",
  "Romans", "1 Corinthians", "2 Corinthians", "Galatians",
  "Ephesians", "Philippians", "Colossians",
  "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy",
  "Titus", "Philemon", "Hebrews", "James",
  "1 Peter", "2 Peter", "1 John", "2 John", "3 John",
  "Jude", "Revelation",
] as const;

export const BIBLE_BOOK_ORDER = [...OT_BOOK_ORDER, ...NT_READING_ORDER] as const;

export type BibleBookName = (typeof BIBLE_BOOK_ORDER)[number];

/** WEB and other sources may include Psalm 151 as an extra chapter; Protestant canon ends at 150. */
export const PROTESTANT_PSALMS_MAX_CHAPTER = 150;

/** `indexOf` on `as const` arrays expects a literal union; use this for arbitrary `string` (e.g. DB names). */
export function bibleBookSortIndex(name: string): number {
  const order = BIBLE_BOOK_ORDER as readonly string[];
  const i = order.indexOf(name);
  return i >= 0 ? i : 999;
}

import { createClient } from "@/lib/supabase/server";
import {
  BIBLE_BOOK_ORDER,
  PROTESTANT_PSALMS_MAX_CHAPTER,
} from "@/lib/bible-book-order";
import { notFound } from "next/navigation";
import { BibleRoadmap, type BookInfo } from "./bible-roadmap";

const PROTESTANT_CANON_BOOKS = new Set<string>(BIBLE_BOOK_ORDER);

/** PostgREST/Supabase often caps each response at 1000 rows; paginate to load the full canon. */
const CHAPTER_PAGE_SIZE = 1000;

type RoadmapSupabase = Awaited<ReturnType<typeof createClient>>;

type RoadmapChapterRow = {
  book_id: string;
  chapter_number: number;
  chunks: { chunk_number: number }[] | null;
};

async function fetchAllChaptersForRoadmap(
  supabase: RoadmapSupabase,
  translationId: string,
): Promise<RoadmapChapterRow[]> {
  const all: RoadmapChapterRow[] = [];
  let from = 0;

  for (;;) {
    const { data, error } = await supabase
      .from("chapters")
      .select("book_id, chapter_number, chunks(chunk_number)")
      .eq("translation_id", translationId)
      .order("book_id", { ascending: true })
      .order("chapter_number", { ascending: true })
      .range(from, from + CHAPTER_PAGE_SIZE - 1);

    if (error) throw error;
    if (!data?.length) break;

    all.push(...(data as RoadmapChapterRow[]));
    if (data.length < CHAPTER_PAGE_SIZE) break;
    from += CHAPTER_PAGE_SIZE;
  }

  return all;
}

export default async function BibleStartPage() {
  const supabase = await createClient();

  const { data: translations } = await supabase
    .from("translations")
    .select("id, abbreviation, name")
    .neq("abbreviation", "LEGACY")
    .order("abbreviation");

  const defaultTranslation =
    translations?.find((t) => t.abbreviation === "WEB") ?? translations?.[0];

  if (!defaultTranslation) notFound();

  const { data: dbBooks } = await supabase
    .from("books")
    .select("id, name, testament");

  const dbChapters = await fetchAllChaptersForRoadmap(supabase, defaultTranslation.id);

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[bible roadmap] chapter rows loaded (all pages):",
      dbChapters.length,
      "translation:",
      defaultTranslation.abbreviation,
    );
  }

  const bookIdToName = new Map(
    (dbBooks ?? []).map((b) => [b.id, { name: b.name, testament: b.testament }]),
  );

  const chaptersByBook = new Map<string, { chapterNumber: number; chunkCount: number }[]>();

  for (const ch of dbChapters) {
    const bookInfo = bookIdToName.get(ch.book_id);
    if (!bookInfo) continue;
    if (!PROTESTANT_CANON_BOOKS.has(bookInfo.name)) continue;
    if (
      bookInfo.name === "Psalms" &&
      ch.chapter_number > PROTESTANT_PSALMS_MAX_CHAPTER
    ) {
      continue;
    }
    const arr = chaptersByBook.get(bookInfo.name) ?? [];
    arr.push({
      chapterNumber: ch.chapter_number,
      chunkCount: Array.isArray(ch.chunks) ? ch.chunks.length : 0,
    });
    chaptersByBook.set(bookInfo.name, arr);
  }

  const books: BookInfo[] = (dbBooks ?? [])
    .filter((b) => PROTESTANT_CANON_BOOKS.has(b.name))
    .map((b) => ({
      name: b.name,
      testament: b.testament as string,
      chapters: (chaptersByBook.get(b.name) ?? []).sort(
        (a, z) => a.chapterNumber - z.chapterNumber,
      ),
    }));

  if (process.env.NODE_ENV === "development") {
    const empty = books.filter((b) => b.chapters.length === 0).map((b) => b.name);
    if (empty.length) {
      console.warn("[bible roadmap] books with zero chapters after grouping:", empty);
    }
  }

  return (
    <BibleRoadmap
      books={books}
      versionAbbr={defaultTranslation.abbreviation}
    />
  );
}

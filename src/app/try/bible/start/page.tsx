import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BibleRoadmap, type BookInfo } from "./bible-roadmap";

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

  const { data: dbChapters } = await supabase
    .from("chapters")
    .select("book_id, chapter_number, chunks(chunk_number)")
    .eq("translation_id", defaultTranslation.id)
    .order("chapter_number")
    .limit(1500);

  const bookIdToName = new Map(
    (dbBooks ?? []).map((b) => [b.id, { name: b.name, testament: b.testament }]),
  );

  const chaptersByBook = new Map<string, { chapterNumber: number; chunkCount: number }[]>();

  for (const ch of dbChapters ?? []) {
    const bookInfo = bookIdToName.get(ch.book_id);
    if (!bookInfo) continue;
    const arr = chaptersByBook.get(bookInfo.name) ?? [];
    arr.push({
      chapterNumber: ch.chapter_number,
      chunkCount: Array.isArray(ch.chunks) ? ch.chunks.length : 0,
    });
    chaptersByBook.set(bookInfo.name, arr);
  }

  const books: BookInfo[] = (dbBooks ?? []).map((b) => ({
    name: b.name,
    testament: b.testament as string,
    chapters: (chaptersByBook.get(b.name) ?? []).sort(
      (a, z) => a.chapterNumber - z.chapterNumber,
    ),
  }));

  return (
    <BibleRoadmap
      books={books}
      versionAbbr={defaultTranslation.abbreviation}
    />
  );
}

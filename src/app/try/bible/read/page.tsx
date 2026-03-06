import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ChunkReader } from "./chunk-reader";

type Props = {
  searchParams: Promise<{
    book?: string;
    chapter?: string;
    chunk?: string;
    version?: string;
  }>;
};

export default async function BibleReadPage({ searchParams }: Props) {
  const params = await searchParams;
  const bookName = params.book ?? "John";
  const chapterNum = parseInt(params.chapter ?? "1", 10);
  const chunkNum = parseInt(params.chunk ?? "1", 10);
  const versionAbbr = params.version ?? "WEB";

  const supabase = await createClient();

  const { data: translation } = await supabase
    .from("translations")
    .select("id, abbreviation, name")
    .eq("abbreviation", versionAbbr)
    .single();

  if (!translation) notFound();

  const { data: allTranslations } = await supabase
    .from("translations")
    .select("abbreviation, name")
    .neq("abbreviation", "LEGACY")
    .order("abbreviation");

  const { data: book } = await supabase
    .from("books")
    .select("id")
    .eq("name", bookName)
    .single();

  if (!book) notFound();

  // Fetch all chapter numbers for this book + translation (for the chapter picker)
  const { data: chaptersForBook } = await supabase
    .from("chapters")
    .select("chapter_number")
    .eq("book_id", book.id)
    .eq("translation_id", translation.id)
    .order("chapter_number");

  const chapterNumbers = chaptersForBook?.map((c) => c.chapter_number) ?? [];

  const { data: chapter } = await supabase
    .from("chapters")
    .select("id")
    .eq("book_id", book.id)
    .eq("translation_id", translation.id)
    .eq("chapter_number", chapterNum)
    .single();

  if (!chapter) notFound();

  const { data: chunk } = await supabase
    .from("chunks")
    .select("id, text, chunk_number")
    .eq("chapter_id", chapter.id)
    .eq("chunk_number", chunkNum)
    .single();

  if (!chunk) notFound();

  const { count: chunksInChapter } = await supabase
    .from("chunks")
    .select("*", { count: "exact", head: true })
    .eq("chapter_id", chapter.id);

  const hasNextChunk = (chunksInChapter ?? 0) > chunkNum;

  return (
    <ChunkReader
      bookName={bookName}
      chapterNumber={chapterNum}
      chunkNumber={chunkNum}
      totalChunks={chunksInChapter ?? 1}
      chunkText={chunk.text}
      hasNextChunk={hasNextChunk}
      versionAbbr={translation.abbreviation}
      versionName={translation.name}
      availableVersions={
        allTranslations?.map((t) => ({
          abbr: t.abbreviation,
          name: t.name,
        })) ?? []
      }
      chapterNumbers={chapterNumbers}
    />
  );
}

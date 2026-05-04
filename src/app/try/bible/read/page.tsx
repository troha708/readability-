import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ChunkReader } from "./chunk-reader";
import type { ExplanationPassage } from "./format-chunk-text";
import type { QuizQuestion } from "./inline-quiz";

type RawQuestion = {
  id: string;
  type: string;
  question: string;
  options?: string[];
  answer?: string;
  correct?: string;
  verse_reference?: string;
  verse_ref?: string;
};

function normalizeQuestion(raw: RawQuestion): QuizQuestion {
  const typeMap: Record<string, QuizQuestion["type"]> = {
    fill_in_the_blank: "fill_blank",
  };
  return {
    id: raw.id,
    type: (typeMap[raw.type] ?? raw.type) as QuizQuestion["type"],
    question: raw.question,
    options: raw.options,
    answer: String(raw.answer ?? raw.correct ?? ""),
    verse_reference: raw.verse_reference ?? raw.verse_ref ?? "",
  };
}

type Props = {
  searchParams: Promise<{
    book?: string;
    chapter?: string;
    version?: string;
  }>;
};

export default async function BibleReadPage({ searchParams }: Props) {
  const params = await searchParams;
  const bookName = params.book ?? "John";
  const chapterNum = parseInt(params.chapter ?? "1", 10);
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

  const { data: chaptersForBook } = await supabase
    .from("chapters")
    .select("chapter_number")
    .eq("book_id", book.id)
    .eq("translation_id", translation.id)
    .order("chapter_number");

  const chapterNumbers = chaptersForBook?.map((c) => c.chapter_number) ?? [];

  const { data: allBooksData } = await supabase
    .from("books")
    .select("name");

  const allBookNames = allBooksData?.map((b) => b.name) ?? [];

  const { data: chapter } = await supabase
    .from("chapters")
    .select("id")
    .eq("book_id", book.id)
    .eq("translation_id", translation.id)
    .eq("chapter_number", chapterNum)
    .single();

  if (!chapter) notFound();

  // Fetch ALL chunks for this chapter
  const { data: chunks } = await supabase
    .from("chunks")
    .select("text, chunk_number")
    .eq("chapter_id", chapter.id)
    .order("chunk_number");

  const chunkTexts = chunks?.map((c) => c.text) ?? [];

  // Load questions from disk
  let questions: QuizQuestion[] = [];
  const slug = bookName.toLowerCase().replace(/ /g, "-");
  const questionsDir = join(process.cwd(), "data", "questions", bookName);
  for (const fileName of [`${slug}-${chapterNum}.json`, `chapter_${chapterNum}.json`]) {
    try {
      const raw = readFileSync(join(questionsDir, fileName), "utf-8");
      questions = (JSON.parse(raw).questions ?? []).map(normalizeQuestion);
      break;
    } catch {
      // try next candidate
    }
  }

  // Load explanations from disk
  let explanations: ExplanationPassage[] | null = null;
  try {
    const explanationPath = join(
      process.cwd(),
      "data",
      "explanations",
      bookName.toLowerCase(),
      `${bookName.toLowerCase()}-${chapterNum}-explanations.json`,
    );
    if (existsSync(explanationPath)) {
      explanations = JSON.parse(readFileSync(explanationPath, "utf-8")).passages ?? null;
    }
  } catch {
    // no explanations for this chapter
  }

  return (
    <ChunkReader
      key={`${bookName}-${chapterNum}`}
      bookName={bookName}
      initialChapterNumber={chapterNum}
      initialChunkTexts={chunkTexts}
      initialQuestions={questions}
      initialExplanations={explanations}
      versionAbbr={translation.abbreviation}
      versionName={translation.name}
      availableVersions={
        allTranslations?.map((t) => ({ abbr: t.abbreviation, name: t.name })) ?? []
      }
      chapterNumbers={chapterNumbers}
      allBookNames={allBookNames}
    />
  );
}

import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@/lib/supabase/server";

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

export type ChapterQuestion = {
  id: string;
  type: "multiple_choice" | "true_false" | "fill_blank";
  question: string;
  options?: string[];
  answer: string;
  verse_reference: string;
};

function normalizeQuestion(raw: RawQuestion): ChapterQuestion {
  const typeMap: Record<string, ChapterQuestion["type"]> = {
    fill_in_the_blank: "fill_blank",
  };
  return {
    id: raw.id,
    type: (typeMap[raw.type] ?? raw.type) as ChapterQuestion["type"],
    question: raw.question,
    options: raw.options,
    answer: String(raw.answer ?? raw.correct ?? ""),
    verse_reference: raw.verse_reference ?? raw.verse_ref ?? "",
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookName = searchParams.get("book") ?? "John";
  const chapterNum = parseInt(searchParams.get("chapter") ?? "1", 10);
  const versionAbbr = searchParams.get("version") ?? "WEB";

  if (isNaN(chapterNum)) {
    return NextResponse.json({ error: "Invalid chapter" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: translation } = await supabase
    .from("translations")
    .select("id")
    .eq("abbreviation", versionAbbr)
    .single();

  if (!translation) {
    return NextResponse.json({ error: "Translation not found" }, { status: 404 });
  }

  const { data: book } = await supabase
    .from("books")
    .select("id")
    .eq("name", bookName)
    .single();

  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const { data: chapter } = await supabase
    .from("chapters")
    .select("id")
    .eq("book_id", book.id)
    .eq("translation_id", translation.id)
    .eq("chapter_number", chapterNum)
    .single();

  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  const { data: chunks } = await supabase
    .from("chunks")
    .select("text, chunk_number")
    .eq("chapter_id", chapter.id)
    .order("chunk_number");

  // Load questions from disk
  let questions: ChapterQuestion[] = [];
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
  let explanations = null;
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

  return NextResponse.json({
    chunks: chunks?.map((c) => c.text) ?? [],
    questions,
    explanations,
  });
}

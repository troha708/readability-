import { readFileSync } from "fs";
import { join } from "path";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Quiz } from "./quiz";

type Question = {
  id: string;
  type: "multiple_choice" | "true_false" | "fill_blank";
  question: string;
  options?: string[];
  answer: string;
  verse_reference: string;
};

type Props = {
  params: Promise<{ book: string; chapter: string }>;
  searchParams: Promise<{ version?: string }>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeQuestion(raw: any): Question {
  const typeMap: Record<string, Question["type"]> = {
    fill_in_the_blank: "fill_blank",
  };

  return {
    id: raw.id,
    type: typeMap[raw.type] ?? raw.type,
    question: raw.question,
    options: raw.options,
    answer: String(raw.answer ?? raw.correct ?? ""),
    verse_reference: raw.verse_reference ?? raw.verse_ref ?? "",
  };
}

export default async function QuestionsPage({ params, searchParams }: Props) {
  const { book, chapter } = await params;
  const sp = await searchParams;
  const versionAbbr = sp.version ?? "WEB";

  const bookName = decodeURIComponent(book);
  const chapterNum = parseInt(chapter, 10);

  if (isNaN(chapterNum)) notFound();

  let questions: Question[] = [];

  const candidateNames = [
    `${bookName.toLowerCase().replace(/ /g, "-")}-${chapterNum}.json`,
    `chapter_${chapterNum}.json`,
  ];

  const questionsDir = join(process.cwd(), "data", "questions", bookName);

  for (const fileName of candidateNames) {
    try {
      const filePath = join(questionsDir, fileName);
      console.log(`[questions] Looking for: ${filePath}`);
      const raw = readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);
      questions = (data.questions ?? []).map(normalizeQuestion);
      console.log(`[questions] Found ${questions.length} questions in ${fileName}`);
      break;
    } catch {
      // try next candidate
    }
  }

  if (questions.length === 0) {
    console.log(`[questions] No questions found for "${bookName}" chapter ${chapterNum}. Tried: ${candidateNames.join(", ")}`);
  }

  const supabase = await createClient();
  let chapterNumbers: number[] = [];

  const { data: translation } = await supabase
    .from("translations")
    .select("id")
    .eq("abbreviation", versionAbbr)
    .single();

  const { data: bookData } = await supabase
    .from("books")
    .select("id")
    .eq("name", bookName)
    .single();

  if (translation && bookData) {
    const { data: chapters } = await supabase
      .from("chapters")
      .select("chapter_number")
      .eq("book_id", bookData.id)
      .eq("translation_id", translation.id)
      .order("chapter_number");
    chapterNumbers = chapters?.map((c) => c.chapter_number) ?? [];
  }

  return (
    <Quiz
      bookName={bookName}
      chapterNumber={chapterNum}
      questions={questions}
      chapterNumbers={chapterNumbers}
      versionAbbr={versionAbbr}
    />
  );
}

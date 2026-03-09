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

export default async function QuestionsPage({ params, searchParams }: Props) {
  const { book, chapter } = await params;
  const sp = await searchParams;
  const versionAbbr = sp.version ?? "WEB";

  const bookName = decodeURIComponent(book);
  const chapterNum = parseInt(chapter, 10);

  if (isNaN(chapterNum)) notFound();

  let questions: Question[] = [];
  try {
    const filePath = join(
      process.cwd(),
      "data",
      "questions",
      bookName,
      `${bookName.toLowerCase()}-${chapterNum}.json`,
    );
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    questions = data.questions ?? [];
  } catch {
    // No questions file for this book/chapter
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

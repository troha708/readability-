"use client";

/**
 * Renders chunk HTML (from api.bible) with Tailwind styling.
 *
 * Handles both the new HTML format (paragraphs, headings, verse spans)
 * and falls back to plain-text rendering for legacy data.
 *
 * When `bionic` is true, the first ~40% of each word is bolded to
 * guide the reader's eye (bionic reading technique).
 *
 * When `explanations` are provided, a lightbulb icon appears at the
 * end of the last paragraph in each verse range. Tapping it reveals
 * a styled explanation card with auto-scroll.
 */
import {
  type ReactNode,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import parse, {
  type DOMNode,
  type HTMLReactParserOptions,
  domToReact,
  Element,
} from "html-react-parser";

export type ExplanationPassage = {
  verses: string;
  explanation: string;
};

function isElement(node: DOMNode): node is Element {
  return node.type === "tag";
}

// ── Bionic reading helper ────────────────────────────────────────────

function bionicifyText(text: string): ReactNode {
  const tokens = text.split(/(\s+)/);
  return tokens.map((token, i) => {
    if (!token || /^\s+$/.test(token)) return token;
    const boldLen = Math.max(1, Math.ceil(token.length * 0.4));
    return (
      <span key={i}>
        <b>{token.slice(0, boldLen)}</b>
        {token.slice(boldLen)}
      </span>
    );
  });
}

// ── Explanation matching helpers ─────────────────────────────────────

function parseVerseRange(verses: string): { start: number; end: number } {
  const [a, b] = verses.split("-").map(Number);
  return { start: a, end: b ?? a };
}

function findPassageForVerse(
  verse: number,
  passages: ExplanationPassage[],
): ExplanationPassage | null {
  for (const p of passages) {
    const { start, end } = parseVerseRange(p.verses);
    if (verse >= start && verse <= end) return p;
  }
  return null;
}

type ParagraphMeta = { firstVerse: number | null; isHeading: boolean };

type ParagraphAnnotation = {
  showIcon: boolean;
  passage: ExplanationPassage | null;
};

function extractVerseNumbersFromHtml(html: string): number[] {
  const nums: number[] = [];
  let m: RegExpExecArray | null;

  const dataNum = /data-number="(\d+)"/g;
  while ((m = dataNum.exec(html)) !== null) nums.push(parseInt(m[1], 10));

  if (nums.length === 0) {
    const vSpan = /<span[^>]*class="v[" ][^>]*>\s*(\d+)/g;
    while ((m = vSpan.exec(html)) !== null) nums.push(parseInt(m[1], 10));
  }

  if (nums.length === 0) {
    const chNum = /<span[^>]*class="[^"]*chapter-num[^"]*"[^>]*>\s*(\d+)/g;
    while ((m = chNum.exec(html)) !== null) nums.push(parseInt(m[1], 10));
  }

  return nums;
}

function extractParagraphMetas(html: string): ParagraphMeta[] {
  const result: ParagraphMeta[] = [];
  const pRegex = /<p\b([^>]*)>([\s\S]*?)<\/p>/g;
  let match: RegExpExecArray | null;

  while ((match = pRegex.exec(html)) !== null) {
    const attrs = match[1];
    const content = match[2];
    const isHeading =
      /class="s\d?"/.test(attrs) || /class="r"/.test(attrs);
    const verses = extractVerseNumbersFromHtml(content);
    result.push({
      firstVerse: verses.length > 0 ? verses[0] : null,
      isHeading,
    });
  }

  return result;
}

function computeAnnotations(
  metas: ParagraphMeta[],
  passages: ExplanationPassage[],
): ParagraphAnnotation[] {
  const annotations: ParagraphAnnotation[] = metas.map((m) => ({
    showIcon: false,
    passage:
      m.firstVerse != null && !m.isHeading
        ? findPassageForVerse(m.firstVerse, passages)
        : null,
  }));

  for (const p of passages) {
    let lastIdx = -1;
    for (let i = 0; i < annotations.length; i++) {
      if (annotations[i].passage === p) lastIdx = i;
    }
    if (lastIdx >= 0) annotations[lastIdx].showIcon = true;
  }

  return annotations;
}

// ── Annotated paragraph wrapper ─────────────────────────────────────

function AnnotatedParagraph({
  className,
  passage,
  children,
}: {
  className: string;
  passage: ExplanationPassage;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const scrollToSelf = useCallback(() => {
    if (wrapperRef.current) {
      wrapperRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  useEffect(() => {
    if (open) {
      const id = setTimeout(scrollToSelf, 100);
      return () => clearTimeout(id);
    }
  }, [open, scrollToSelf]);

  return (
    <div ref={wrapperRef} className="scroll-mt-24">
      <p className={className}>
        {children}
        <button
          onClick={() => setOpen((o) => !o)}
          className="ml-1.5 inline translate-y-[-0.1em] cursor-pointer select-none text-[0.55em] text-gray-300 transition-colors hover:text-amber-400 dark:text-gray-600 dark:hover:text-amber-400/80"
          aria-label={`Explanation for verses ${passage.verses}`}
        >
          💡
        </button>
      </p>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mb-3 mt-2 rounded-xl bg-gray-100/80 px-4 py-3.5 text-[0.85em] leading-relaxed text-gray-600 dark:bg-gray-800/50 dark:text-gray-400">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <span className="mb-1 mr-2 inline-block rounded-md bg-gray-200/80 px-1.5 py-0.5 text-[0.7em] font-semibold tabular-nums text-gray-500 dark:bg-gray-700/60 dark:text-gray-400">
                vv.&thinsp;{passage.verses}
              </span>
              {passage.explanation}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-md p-0.5 text-lg leading-none text-gray-400 transition-colors hover:bg-gray-200/60 hover:text-gray-600 dark:hover:bg-gray-700/40 dark:hover:text-gray-300"
              aria-label="Close explanation"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── HTML parser options ──────────────────────────────────────────────

function getParserOptions(
  bionic: boolean,
  annotations?: ParagraphAnnotation[],
): HTMLReactParserOptions {
  let pIdx = 0;

  const opts: HTMLReactParserOptions = {
    replace(domNode) {
      if (bionic && domNode.type === "text") {
        const text = (domNode as unknown as { data: string }).data;
        if (!text.trim()) return;
        return <>{bionicifyText(text)}</>;
      }

      if (!isElement(domNode)) return;

      const tag = domNode.name;
      const cls = domNode.attribs?.class ?? "";
      const children = domToReact(domNode.children as DOMNode[], opts);

      if (tag === "p") {
        const currentIdx = pIdx++;
        const annotation = annotations?.[currentIdx];

        if (/^s\d?$/.test(cls)) {
          return (
            <h3 className="mb-3 mt-8 text-lg font-bold text-gray-900 dark:text-gray-100 first:mt-0">
              {children}
            </h3>
          );
        }

        if (cls === "r") {
          return (
            <p className="mb-[1.5em] text-sm italic text-gray-500 dark:text-gray-400">
              {children}
            </p>
          );
        }

        let pClassName: string;
        if (cls === "q1") {
          pClassName =
            "mb-1 pl-6 leading-relaxed text-gray-800 dark:text-gray-200";
        } else if (/^q[2-9]$/.test(cls)) {
          pClassName =
            "mb-1 pl-12 leading-relaxed text-gray-800 dark:text-gray-200";
        } else {
          pClassName =
            "mb-[1.5em] leading-relaxed text-gray-800 dark:text-gray-200";
        }

        if (annotation?.showIcon && annotation.passage) {
          return (
            <AnnotatedParagraph
              className={pClassName}
              passage={annotation.passage}
            >
              {children}
            </AnnotatedParagraph>
          );
        }

        return <p className={pClassName}>{children}</p>;
      }

      if (
        tag === "span" &&
        (cls === "v" || cls.startsWith("v ") || domNode.attribs?.["data-number"])
      ) {
        return (
          <sup className="ml-1 mr-px align-super text-[0.6em] leading-none text-gray-400/70 dark:text-gray-500/70">
            {children}
          </sup>
        );
      }

      if (tag === "span" && cls.includes("chapter-num")) {
        return (
          <sup className="mr-0.5 align-super text-[0.65em] font-semibold leading-none text-gray-400/70 dark:text-gray-500/70">
            {children}
          </sup>
        );
      }

      if (tag === "span" && cls === "nd") {
        return <span className="font-semibold tracking-wide">{children}</span>;
      }

      if (tag === "wj") {
        return (
          <span className="text-red-700 dark:text-red-400">{children}</span>
        );
      }

      if (["span", "sup", "b", "i", "em", "strong", "br"].includes(tag)) {
        return undefined;
      }

      return <>{children}</>;
    },
  };
  return opts;
}

function renderHtml(
  html: string,
  bionic: boolean,
  explanations?: ExplanationPassage[],
) {
  let annotations: ParagraphAnnotation[] | undefined;
  if (explanations?.length) {
    const metas = extractParagraphMetas(html);
    annotations = computeAnnotations(metas, explanations);
  }
  return parse(html, getParserOptions(bionic, annotations));
}

/** Detect whether the chunk text contains HTML tags. */
function isHtml(text: string): boolean {
  return /<[a-z][\s>]/i.test(text);
}

// ── Legacy plain-text fallback ───────────────────────────────────────

const VERSE_SPLIT = /(?=\s\d+\S)/;
const VERSE_NUM_RE = /^\s*(\d+)([\s\S]*)/;
const VERSES_PER_PARA = 5;

function renderPlainText(
  text: string,
  bionic: boolean,
  explanations?: ExplanationPassage[],
) {
  const segments = text
    .trim()
    .split(VERSE_SPLIT)
    .map((s) => s.trim())
    .filter(Boolean);

  const verses: { num: string; body: string }[] = [];
  for (const seg of segments) {
    const m = seg.match(VERSE_NUM_RE);
    if (m) verses.push({ num: m[1], body: m[2].trim() });
    else verses.push({ num: "", body: seg });
  }

  const hasNums = verses.some((v) => v.num);
  if (!hasNums) {
    return (
      <p className="leading-relaxed text-gray-800 dark:text-gray-200">
        {bionic ? bionicifyText(text) : text}
      </p>
    );
  }

  const paragraphs: (typeof verses)[] = [];
  for (let i = 0; i < verses.length; i += VERSES_PER_PARA) {
    paragraphs.push(verses.slice(i, i + VERSES_PER_PARA));
  }

  let ptAnnotations: ParagraphAnnotation[] | undefined;
  if (explanations?.length) {
    const metas: ParagraphMeta[] = paragraphs.map((pv) => {
      const first = pv.find((v) => v.num);
      return {
        firstVerse: first ? parseInt(first.num, 10) : null,
        isHeading: false,
      };
    });
    ptAnnotations = computeAnnotations(metas, explanations);
  }

  const pClassName = "leading-relaxed text-gray-800 dark:text-gray-200";

  return (
    <div className="space-y-5">
      {paragraphs.map((pv, idx) => {
        const annotation = ptAnnotations?.[idx];
        const content = pv.map((v, i) => (
          <span key={i}>
            {v.num && (
              <sup className="ml-1 mr-px align-super text-[0.6em] leading-none text-gray-400/70 dark:text-gray-500/70">
                {v.num}
              </sup>
            )}
            {bionic ? bionicifyText(v.body) : v.body}
            {i < pv.length - 1 ? " " : null}
          </span>
        ));

        if (annotation?.showIcon && annotation.passage) {
          return (
            <AnnotatedParagraph
              key={idx}
              className={pClassName}
              passage={annotation.passage}
            >
              {content}
            </AnnotatedParagraph>
          );
        }

        return (
          <p key={idx} className={pClassName}>
            {content}
          </p>
        );
      })}
    </div>
  );
}

// ── Exported component ───────────────────────────────────────────────

export function FormattedChunkText({
  chunkText,
  bionic = false,
  explanations,
}: {
  chunkText: string;
  bionic?: boolean;
  explanations?: ExplanationPassage[];
}) {
  if (!chunkText?.trim()) {
    return (
      <p className="leading-relaxed text-gray-800 dark:text-gray-200">
        {chunkText}
      </p>
    );
  }

  if (isHtml(chunkText)) {
    return <div>{renderHtml(chunkText, bionic, explanations)}</div>;
  }

  return renderPlainText(chunkText, bionic, explanations);
}

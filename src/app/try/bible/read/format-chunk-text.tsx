/**
 * Renders chunk HTML (from api.bible) with Tailwind styling.
 *
 * Handles both the new HTML format (paragraphs, headings, verse spans)
 * and falls back to plain-text rendering for legacy data.
 *
 * When `bionic` is true, the first ~40% of each word is bolded to
 * guide the reader's eye (bionic reading technique).
 */
import type { ReactNode } from "react";
import parse, {
  type DOMNode,
  type HTMLReactParserOptions,
  domToReact,
  Element,
} from "html-react-parser";

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

// ── HTML parser options ──────────────────────────────────────────────

function getParserOptions(bionic: boolean): HTMLReactParserOptions {
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

      if (tag === "p" && /^s\d?$/.test(cls)) {
        return (
          <h3 className="mb-3 mt-8 text-lg font-bold text-gray-900 dark:text-gray-100 first:mt-0">
            {children}
          </h3>
        );
      }

      if (tag === "p" && cls === "r") {
        return (
          <p className="mb-[1.5em] text-sm italic text-gray-500 dark:text-gray-400">
            {children}
          </p>
        );
      }

      if (tag === "p" && cls === "q1") {
        return (
          <p className="mb-1 pl-6 leading-relaxed text-gray-800 dark:text-gray-200">
            {children}
          </p>
        );
      }
      if (tag === "p" && /^q[2-9]$/.test(cls)) {
        return (
          <p className="mb-1 pl-12 leading-relaxed text-gray-800 dark:text-gray-200">
            {children}
          </p>
        );
      }

      if (tag === "p") {
        return (
          <p className="mb-[1.5em] leading-relaxed text-gray-800 dark:text-gray-200">
            {children}
          </p>
        );
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

function renderHtml(html: string, bionic: boolean) {
  return parse(html, getParserOptions(bionic));
}

/** Detect whether the chunk text contains HTML tags. */
function isHtml(text: string): boolean {
  return /<[a-z][\s>]/i.test(text);
}

// ── Legacy plain-text fallback ───────────────────────────────────────

const VERSE_SPLIT = /(?=\s\d+\S)/;
const VERSE_NUM_RE = /^\s*(\d+)(.*)/s;
const VERSES_PER_PARA = 5;

function renderPlainText(text: string, bionic: boolean) {
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

  return (
    <div className="space-y-5">
      {paragraphs.map((pv, idx) => (
        <p
          key={idx}
          className="leading-relaxed text-gray-800 dark:text-gray-200"
        >
          {pv.map((v, i) => (
            <span key={i}>
              {v.num && (
                <sup className="ml-1 mr-px align-super text-[0.6em] leading-none text-gray-400/70 dark:text-gray-500/70">
                  {v.num}
                </sup>
              )}
              {bionic ? bionicifyText(v.body) : v.body}
              {i < pv.length - 1 ? " " : null}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}

// ── Exported component ───────────────────────────────────────────────

export function FormattedChunkText({
  chunkText,
  bionic = false,
}: {
  chunkText: string;
  bionic?: boolean;
}) {
  if (!chunkText?.trim()) {
    return (
      <p className="leading-relaxed text-gray-800 dark:text-gray-200">
        {chunkText}
      </p>
    );
  }

  if (isHtml(chunkText)) {
    return <div>{renderHtml(chunkText, bionic)}</div>;
  }

  return renderPlainText(chunkText, bionic);
}

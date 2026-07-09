"use client";

import React, { useState, useCallback } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Copy button for fenced code blocks                                 */
/* ------------------------------------------------------------------ */
function CodeCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard API may fail in insecure contexts */
    }
  }, [code]);

  return (
    <button
      onClick={handleCopy}
      aria-label="Copy code"
      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md
                 bg-white/10 text-gray-400 opacity-0 backdrop-blur transition
                 hover:bg-white/20 hover:text-gray-200 group-hover/code:opacity-100"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Extract plain text from React children (for copy button)           */
/* ------------------------------------------------------------------ */
function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return extractText(props.children);
  }
  return "";
}

/* ------------------------------------------------------------------ */
/*  Program overview table (Detail | Value) → horizontal layout      */
/* ------------------------------------------------------------------ */
type HastLike = {
  type: string;
  tagName?: string;
  value?: string;
  children?: HastLike[];
};

function hastPlainText(node: HastLike | undefined): string {
  if (!node) return "";
  if (node.type === "text" && node.value != null) return node.value;
  if (!node.children?.length) return "";
  return node.children.map((c) => hastPlainText(c)).join("");
}

function normalizeOverviewCell(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Markdown program overview uses | Detail | Value | — detect and parse for custom layout. */
function parseProgramOverviewPairs(node: HastLike | undefined): { label: string; value: string }[] | null {
  if (!node || node.type !== "element" || node.tagName !== "table" || !node.children?.length) {
    return null;
  }

  const thead = node.children.find((c) => c.type === "element" && c.tagName === "thead");
  const tbody = node.children.find((c) => c.type === "element" && c.tagName === "tbody");
  if (!thead?.children?.length || !tbody?.children?.length) return null;

  const headerRow = thead.children.find((c) => c.type === "element" && c.tagName === "tr");
  if (!headerRow?.children?.length) return null;

  const thEls = headerRow.children.filter((c) => c.type === "element" && c.tagName === "th");
  if (thEls.length !== 2) return null;

  const h0 = normalizeOverviewCell(hastPlainText(thEls[0]));
  const h1 = normalizeOverviewCell(hastPlainText(thEls[1]));
  if (!/^detail$/i.test(h0) || !/^value$/i.test(h1)) return null;

  const rowEls = tbody.children.filter((c) => c.type === "element" && c.tagName === "tr");
  const pairs: { label: string; value: string }[] = [];

  for (const tr of rowEls) {
    const cells = tr.children?.filter(
      (c) => c.type === "element" && (c.tagName === "td" || c.tagName === "th"),
    );
    if (!cells || cells.length !== 2) return null;
    const label = normalizeOverviewCell(hastPlainText(cells[0]));
    const value = normalizeOverviewCell(hastPlainText(cells[1]));
    pairs.push({ label, value });
  }

  return pairs.length > 0 ? pairs : null;
}

function ProgramOverviewTable({ pairs }: { pairs: { label: string; value: string }[] }) {
  return (
    <div
      className="program-overview-table my-4 overflow-x-hidden rounded-lg border border-gray-200 dark:border-gray-700"
      role="region"
      aria-label="Program overview"
    >
      <div className="grid min-w-0 grid-cols-2 gap-3 p-3 md:grid-cols-3 xl:grid-cols-6">
        {pairs.map((pair, i) => (
          <div
            key={pair.label}
            className={
              i % 2 === 1
                ? "flex min-w-0 flex-col gap-1.5 rounded-md border border-gray-200/80 bg-gray-50/50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/40 md:px-4 md:py-3"
                : "flex min-w-0 flex-col gap-1.5 rounded-md border border-gray-200/80 px-3 py-2.5 dark:border-gray-700 md:px-4 md:py-3"
            }
          >
            <div className="text-[0.7rem] font-semibold uppercase leading-snug tracking-wider text-gray-600 dark:text-gray-400 md:text-xs">
              {pair.label}
            </div>
            <div className="break-words text-sm text-gray-800 dark:text-gray-200">
              {pair.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Custom components for react-markdown                               */
/* ------------------------------------------------------------------ */
const markdownComponents: Components = {
  /* ---------- Headings ---------- */
  h1: ({ children }) => (
    <h1 className="mb-4 mt-6 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-6 border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900 dark:border-gray-700 dark:text-gray-50 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-5 text-lg font-semibold text-gray-900 dark:text-gray-100 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-2 mt-4 text-base font-semibold text-gray-900 dark:text-gray-100 first:mt-0">
      {children}
    </h4>
  ),

  /* ---------- Paragraphs ---------- */
  p: ({ children }) => (
    <p className="my-3 max-w-[65ch] leading-7 text-gray-800 dark:text-gray-200">
      {children}
    </p>
  ),

  /* ---------- Strong / Emphasis ---------- */
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900 dark:text-gray-100">
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="text-gray-700 dark:text-gray-300">{children}</em>
  ),

  /* ---------- Lists ---------- */
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-1.5 pl-6 marker:text-primary/60 dark:marker:text-primary/50">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1.5 pl-6 marker:text-primary/60 marker:font-medium dark:marker:text-primary/50">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="leading-7 text-gray-800 dark:text-gray-200 [&>ul]:my-1.5 [&>ol]:my-1.5">
      {children}
    </li>
  ),

  /* ---------- Blockquotes ---------- */
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-4 border-primary/40 bg-primary/5 py-2 pl-4 pr-3 italic text-gray-700 dark:border-primary/30 dark:bg-primary/5 dark:text-gray-300 [&>p]:my-1">
      {children}
    </blockquote>
  ),

  /* ---------- Horizontal Rule ---------- */
  hr: () => <hr className="my-6 border-gray-200 dark:border-gray-700" />,

  /* ---------- Links ---------- */
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary underline decoration-primary/30 underline-offset-2 transition hover:decoration-primary/60"
    >
      {children}
    </a>
  ),

  /* ---------- Images (disabled: model must not rely on remote URLs) ---------- */
  img: ({ alt }) =>
    alt?.trim() ? (
      <p className="my-2 text-sm italic text-gray-500 dark:text-gray-400">{alt}</p>
    ) : null,

  /* ---------- Tables ---------- */
  table: ({ node, children }) => {
    const pairs = parseProgramOverviewPairs(node as HastLike | undefined);
    if (pairs) {
      return <ProgramOverviewTable pairs={pairs} />;
    }
    return (
      <div className="my-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    );
  },
  thead: ({ children }) => (
    <thead className="bg-gray-50 dark:bg-gray-800/60">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 [&>tr:nth-child(even)]:bg-gray-50/50 dark:[&>tr:nth-child(even)]:bg-gray-800/30">
      {children}
    </tbody>
  ),
  tr: ({ children }) => (
    <tr className="transition-colors hover:bg-gray-100/60 dark:hover:bg-gray-800/40">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">{children}</td>
  ),

  /* ---------- Code (inline + block) ---------- */
  code: ({ className, children, ...rest }) => {
    const isBlock = className?.startsWith("hljs") || className?.includes("language-");

    if (isBlock) {
      // Block code — rendered inside a <pre> wrapper (see `pre` below)
      return (
        <code className={`${className ?? ""} text-sm`} {...rest}>
          {children}
        </code>
      );
    }

    // Inline code
    return (
      <code className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[0.85em] font-medium text-pink-600 dark:bg-gray-800 dark:text-pink-400">
        {children}
      </code>
    );
  },

  pre: ({ children }) => {
    const code = extractText(children);
    return (
      <div className="group/code relative my-4">
        <pre className="overflow-x-auto rounded-lg bg-[#0d1117] p-4 text-sm leading-relaxed text-gray-100 shadow-sm">
          {children}
        </pre>
        <CodeCopyButton code={code} />
      </div>
    );
  },

  /* ---------- Checkboxes (GFM task lists) ---------- */
  input: ({ type, checked, ...rest }) => {
    if (type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={checked}
          readOnly
          className="mr-2 h-4 w-4 rounded border-gray-300 text-primary accent-primary dark:border-gray-600"
          {...rest}
        />
      );
    }
    return <input type={type} {...rest} />;
  },
};

/* ------------------------------------------------------------------ */
/*  LLMResponse component                                              */
/* ------------------------------------------------------------------ */
type LLMResponseProps = {
  content: string;
};

export default function LLMResponse({ content }: LLMResponseProps) {
  return (
    <div
      className="llm-response space-y-1 [&_.program-overview-table+h3]:mt-8 [&_.program-overview-table+h3]:border-t [&_.program-overview-table+h3]:border-gray-200 [&_.program-overview-table+h3]:pt-8 dark:[&_.program-overview-table+h3]:border-gray-700"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

"use client";

import { ClipboardCopy, Pencil, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type BubbleProps = {
  text: string;
  timestamp?: Date | string;
  mine?: boolean;
  isLoading?: boolean;
  onCopy?: (text: string) => void;
  onEdit?: (text: string) => void;
};

export default function MessageBubble({
  text,
  timestamp,
  mine = true,
  isLoading = false,
  onCopy,
  onEdit,
}: BubbleProps) {
  const time = timestamp ? new Date(timestamp).toLocaleTimeString() : undefined;
  const renderInlineHtml = (value: string) => {
    const escapeHtml = (input: string) =>
      input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    let html = escapeHtml(value);
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");
    html = html.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
    html = html.replace(/(^|[^_])_([^_]+)_(?!_)/g, "$1<em>$2</em>");
    return html;
  };

  const renderInlineText = (value: string) => {
    const lines = value.split("\n");
    const nodes: React.ReactNode[] = [];
    lines.forEach((line, idx) => {
      nodes.push(
        <span
          key={`line-${idx}`}
          dangerouslySetInnerHTML={{ __html: renderInlineHtml(line) }}
        />,
      );
      if (idx < lines.length - 1) {
        nodes.push(<br key={`br-${idx}`} />);
      }
    });
    return nodes;
  };

  const renderAssistantContent = (value: string) => {
    type Block =
      | { type: "heading"; level: number; content: string }
      | { type: "paragraph"; content: string }
      | { type: "ul"; items: string[] }
      | { type: "ol"; items: string[] };

    const lines = value.split("\n");
    const blocks: Block[] = [];
    let paragraph: string[] = [];

    const flushParagraph = () => {
      if (paragraph.length > 0) {
        blocks.push({ type: "paragraph", content: paragraph.join(" ").trim() });
        paragraph = [];
      }
    };

    let i = 0;
    while (i < lines.length) {
      const rawLine = lines[i];
      const line = rawLine.trim();

      if (!line) {
        flushParagraph();
        i += 1;
        continue;
      }

      const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
      if (headingMatch) {
        flushParagraph();
        blocks.push({
          type: "heading",
          level: headingMatch[1].length,
          content: headingMatch[2].trim(),
        });
        i += 1;
        continue;
      }

      const olMatch = line.match(/^\d+\.\s+(.*)$/);
      if (olMatch) {
        flushParagraph();
        const items: string[] = [];
        while (i < lines.length) {
          const olLine = lines[i].trim();
          const itemMatch = olLine.match(/^\d+\.\s+(.*)$/);
          if (!itemMatch) break;
          items.push(itemMatch[1].trim());
          i += 1;
        }
        blocks.push({ type: "ol", items });
        continue;
      }

      const ulMatch = line.match(/^[-*]\s+(.*)$/);
      if (ulMatch) {
        flushParagraph();
        const items: string[] = [];
        while (i < lines.length) {
          const ulLine = lines[i].trim();
          const itemMatch = ulLine.match(/^[-*]\s+(.*)$/);
          if (!itemMatch) break;
          items.push(itemMatch[1].trim());
          i += 1;
        }
        blocks.push({ type: "ul", items });
        continue;
      }

      paragraph.push(line);
      i += 1;
    }

    flushParagraph();

    return (
      <div className="space-y-3 md:space-y-4">
        {blocks.map((block, idx) => {
      if (block.type === "heading") {
        const Tag = block.level === 1 ? "h2" : block.level === 2 ? "h3" : "h4";
        return (
          <Tag
            key={`h-${idx}`}
            dangerouslySetInnerHTML={{ __html: renderInlineHtml(block.content) }}
          />
        );
      }
      if (block.type === "ul") {
        return (
          <ul key={`ul-${idx}`}>
            {block.items.map((item, itemIdx) => (
              <li
                key={`ul-${idx}-${itemIdx}`}
                dangerouslySetInnerHTML={{ __html: renderInlineHtml(item) }}
              />
            ))}
          </ul>
        );
      }
      if (block.type === "ol") {
        return (
          <ol key={`ol-${idx}`}>
            {block.items.map((item, itemIdx) => (
              <li
                key={`ol-${idx}-${itemIdx}`}
                dangerouslySetInnerHTML={{ __html: renderInlineHtml(item) }}
              />
            ))}
          </ol>
        );
      }
        return (
          <p
            key={`p-${idx}`}
            dangerouslySetInnerHTML={{ __html: renderInlineHtml(block.content) }}
          />
        );
      })}
      </div>
    );
  };

  const bubbleClass = mine
    ? "rounded-2xl p-3 break-words whitespace-pre-wrap shadow bg-primary text-primary-foreground"
    : "w-full max-w-none p-0";

  return (
    <div className={`flex w-full ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`group outline-none ${mine ? "max-w-[75%]" : "w-full max-w-none"}`}
        tabIndex={0}
      >
        {/* Bubble */}
        <div
          className={[
            bubbleClass,
            mine
              ? ""
              : [
                  "prose prose-sm md:prose-base dark:prose-invert max-w-none leading-relaxed",
                  "prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-gray-100",
                  "prose-p:my-3 prose-p:leading-7",
                  "prose-ul:my-3 prose-ol:my-3 prose-li:my-1.5",
                  "prose-ul:pl-5 prose-ol:pl-5",
                  "prose-strong:text-gray-900 dark:prose-strong:text-gray-100",
                ].join(" "),
          ].join(" ")}
        >
          {isLoading ? (
            <div className="flex items-center gap-1.5 py-1">
              <span className="h-2 w-2 rounded-full bg-current opacity-60 animate-[bounce_1.4s_ease-in-out_infinite]"></span>
              <span className="h-2 w-2 rounded-full bg-current opacity-60 animate-[bounce_1.4s_ease-in-out_0.2s_infinite]"></span>
              <span className="h-2 w-2 rounded-full bg-current opacity-60 animate-[bounce_1.4s_ease-in-out_0.4s_infinite]"></span>
            </div>
          ) : (
            <div>{mine ? renderInlineText(text) : renderAssistantContent(text)}</div>
          )}
          {time && !isLoading ? null : null}
        </div>

        {/* Actions BELOW the bubble (hidden until hover/focus) */}
        <div className="mt-1 flex justify-end gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="h-7 w-7 rounded-md shadow"
                aria-label="Copy"
                onClick={() => onCopy?.(text)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Copy</TooltipContent>
          </Tooltip>

          {onEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7 rounded-md shadow"
                  aria-label="Edit"
                  onClick={() => onEdit(text)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Edit</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

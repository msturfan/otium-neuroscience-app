"use client";

import { Pencil, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import LLMResponse from "@/components/LLMResponse";

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
  const renderInlineText = (value: string) => {
    const escapeHtml = (input: string) =>
      input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const renderInlineHtml = (raw: string) => {
      let html = escapeHtml(raw);
      html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");
      html = html.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
      html = html.replace(/(^|[^_])_([^_]+)_(?!_)/g, "$1<em>$2</em>");
      return html;
    };

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
        <div className={bubbleClass}>
          {isLoading ? (
            <div className="flex items-center gap-1.5 py-1">
              <span className="h-2 w-2 rounded-full bg-current opacity-60 animate-[bounce_1.4s_ease-in-out_infinite]"></span>
              <span className="h-2 w-2 rounded-full bg-current opacity-60 animate-[bounce_1.4s_ease-in-out_0.2s_infinite]"></span>
              <span className="h-2 w-2 rounded-full bg-current opacity-60 animate-[bounce_1.4s_ease-in-out_0.4s_infinite]"></span>
            </div>
          ) : (
            <div>
              {mine ? renderInlineText(text) : <LLMResponse content={text} />}
            </div>
          )}
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

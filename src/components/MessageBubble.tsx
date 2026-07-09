"use client";

import type { ReactNode } from "react";
import { Copy, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import LLMResponse from "@/components/LLMResponse";
import ChatThinkingPanel from "@/components/ChatThinkingPanel";
import type {
  ChatStreamActivityLine,
  ChatStreamStep,
  ChatStreamTerminal,
} from "@/lib/chat-sse-client";

type BubbleProps = {
  text: string;
  timestamp?: Date | string;
  mine?: boolean;
  isLoading?: boolean;
  streamStatusLabel?: string;
  streamSteps?: ChatStreamStep[];
  streamActivityLines?: ChatStreamActivityLine[];
  streamError?: string;
  streamTerminal?: ChatStreamTerminal;
  streamStartedAt?: string;
  streamEndedAt?: string;
  onCopy?: (text: string) => void;
  onEdit?: (text: string) => void;
};

export default function MessageBubble({
  text,
  timestamp,
  mine = true,
  isLoading = false,
  streamStatusLabel,
  streamSteps,
  streamActivityLines,
  streamError,
  streamTerminal,
  streamStartedAt,
  streamEndedAt,
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
    const nodes: ReactNode[] = [];
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

  const showThinkingChrome =
    !mine &&
    (isLoading ||
      Boolean(streamStatusLabel?.trim()) ||
      Boolean(streamError?.trim()) ||
      (streamSteps && streamSteps.length > 0) ||
      (streamActivityLines && streamActivityLines.length > 0) ||
      streamTerminal === "completed" ||
      streamTerminal === "failed");

  const showAnswer = Boolean(text?.trim());

  return (
    <div className={`flex w-full ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`group outline-none ${mine ? "max-w-[75%]" : "w-full max-w-none"}`}
        tabIndex={0}
      >
        <div className={bubbleClass}>
          {mine ? (
            renderInlineText(text)
          ) : (
            <div>
              {showThinkingChrome ? (
                <ChatThinkingPanel
                  statusLabel={streamStatusLabel}
                  steps={streamSteps}
                  activityLines={streamActivityLines}
                  streamError={streamError}
                  streamTerminal={streamTerminal}
                  streamStartedAt={streamStartedAt}
                  streamEndedAt={streamEndedAt}
                  connecting={isLoading}
                />
              ) : null}
              {showAnswer ? <LLMResponse content={text} /> : null}
            </div>
          )}
        </div>

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

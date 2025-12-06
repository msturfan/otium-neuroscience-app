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
  onCopy?: (text: string) => void;
  onEdit?: (text: string) => void;
};

export default function MessageBubble({
  text,
  timestamp,
  mine = true,
  onCopy,
  onEdit,
}: BubbleProps) {
  const time = timestamp ? new Date(timestamp).toLocaleTimeString() : undefined;

  return (
    <div className={`flex w-full ${mine ? "justify-end" : "justify-start"}`}>
      <div className="group max-w-[75%] outline-none" tabIndex={0}>
        {/* Bubble */}
        <div
          className={[
            "rounded-2xl p-3 break-words whitespace-pre-wrap shadow",
            mine ? "bg-primary text-primary-foreground" : "bg-muted",
          ].join(" ")}
        >
          <p>{text}</p>
          {time ? (
            <span className="mt-1 block text-[10px] opacity-60">{time}</span>
          ) : null}
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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="h-7 w-7 rounded-md shadow"
                aria-label="Edit"
                onClick={() => onEdit?.(text)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Edit</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

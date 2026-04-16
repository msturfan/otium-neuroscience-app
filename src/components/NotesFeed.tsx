"use client";

import { useEffect, useRef } from "react";
import type {
  ChatStreamActivityLine,
  ChatStreamStep,
  ChatStreamTerminal,
} from "@/lib/chat-sse-client";
import MessageBubble from "./MessageBubble";

export type NoteLike = {
  id: string;
  text: string;
  createdAt: Date | string;
  isAI?: boolean; // If true, this is an AI message (left-aligned)
  isLoading?: boolean; // If true, show loading indicator
  /** Backend-driven assistant status line while streaming (SSE). */
  streamStatusLabel?: string;
  streamSteps?: ChatStreamStep[];
  streamActivityLines?: ChatStreamActivityLine[];
  streamError?: string;
  streamTerminal?: ChatStreamTerminal;
  streamUserPrompt?: string;
  streamStartedAt?: string;
  streamEndedAt?: string;
};

type Props = {
  notes: NoteLike[];
  onCopy?: (text: string) => void;
  onEdit?: (text: string) => void;
};

export default function NotesFeed({ notes, onCopy, onEdit }: Props) {
  const visible = [...notes]
    .filter(
      (n) =>
        n.isLoading ||
        (n.streamSteps && n.streamSteps.length > 0) ||
        (n.streamActivityLines && n.streamActivityLines.length > 0) ||
        (n.streamStatusLabel && n.streamStatusLabel.trim().length > 0) ||
        (n.streamError && n.streamError.trim().length > 0) ||
        n.streamTerminal === "completed" ||
        n.streamTerminal === "failed" ||
        (n.text && n.text.trim().length > 0 && n.text !== "EMPTY"),
    )
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));

  const boxRef = useRef<HTMLDivElement | null>(null);

  // Get the latest message text for scroll-on-stream
  const last = visible[visible.length - 1];
  const lastMessageText = last?.text ?? "";
  const lastMessageLoading = last?.isLoading ?? false;
  const lastStreamSig = last
    ? `${last.streamStatusLabel ?? ""}|${last.streamError ?? ""}|${last.streamTerminal ?? ""}|${last.streamEndedAt ?? ""}|${(last.streamSteps ?? []).map((s) => `${s.id}:${s.state}`).join(",")}`
    : "";

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [visible.length, lastMessageText, lastMessageLoading, lastStreamSig]);

  return (
    <div ref={boxRef} className="w-full space-y-6">
      {visible.map((n) => (
        <MessageBubble
          key={n.id}
          text={n.text || ""}
          timestamp={n.createdAt}
          mine={!n.isAI}
          isLoading={n.isLoading}
          streamStatusLabel={n.streamStatusLabel}
          streamSteps={n.streamSteps}
          streamActivityLines={n.streamActivityLines}
          streamError={n.streamError}
          streamTerminal={n.streamTerminal}
          streamStartedAt={n.streamStartedAt}
          streamEndedAt={n.streamEndedAt}
          onCopy={onCopy}
          onEdit={n.isAI ? undefined : onEdit}
        />
      ))}
    </div>
  );
}

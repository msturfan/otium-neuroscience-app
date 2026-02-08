"use client";

import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

export type NoteLike = { 
  id: string; 
  text: string; 
  createdAt: Date | string;
  isAI?: boolean; // If true, this is an AI message (left-aligned)
  isLoading?: boolean; // If true, show loading indicator
};

type Props = {
  notes: NoteLike[];
  onCopy?: (text: string) => void;
  onEdit?: (text: string) => void;
};

export default function NotesFeed({ notes, onCopy, onEdit }: Props) {
  const visible = [...notes]
    .filter((n) => n.isLoading || (n.text && n.text.trim().length > 0 && n.text !== "EMPTY"))
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));

  const boxRef = useRef<HTMLDivElement | null>(null);

  // Get the latest message text for scroll-on-stream
  const lastMessageText = visible[visible.length - 1]?.text ?? "";
  const lastMessageLoading = visible[visible.length - 1]?.isLoading ?? false;

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [visible.length, lastMessageText, lastMessageLoading]);

  return (
    <div ref={boxRef} className="w-full space-y-6">
      {visible.map((n) => (
        <MessageBubble
          key={n.id}
          text={n.text || ""}
          timestamp={n.createdAt}
          mine={!n.isAI}
          isLoading={n.isLoading}
          onCopy={onCopy}
          onEdit={n.isAI ? undefined : onEdit}
        />
      ))}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatStreamTerminal } from "@/lib/chat-sse-client";

function formatElapsed(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "0s";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return `${m}m ${rs}s`;
}

function useElapsedLabel(
  tick: boolean,
  startedAtIso?: string,
  endedAtIso?: string,
): string {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!tick) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [tick]);

  return useMemo(() => {
    if (!startedAtIso) return "—";
    const start = Date.parse(startedAtIso);
    if (Number.isNaN(start)) return "—";
    const end = endedAtIso ? Date.parse(endedAtIso) : now;
    const safeEnd = Number.isNaN(end) ? now : end;
    return formatElapsed(safeEnd - start);
  }, [startedAtIso, endedAtIso, now]);
}

type Props = {
  statusLabel?: string;
  steps?: unknown[];
  activityLines?: unknown[];
  streamError?: string;
  streamTerminal?: ChatStreamTerminal;
  streamStartedAt?: string;
  streamEndedAt?: string;
  /** True while waiting for the SSE stream (before first snapshot). */
  connecting?: boolean;
  className?: string;
};

export default function ChatThinkingPanel({
  statusLabel,
  steps: _steps = [],
  activityLines: _activityLines = [],
  streamError,
  streamTerminal,
  streamStartedAt,
  streamEndedAt,
  connecting = false,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const inFlight =
    connecting ||
    streamTerminal === "none" ||
    (streamTerminal === undefined && !streamEndedAt);

  const headerStatus =
    statusLabel?.trim() ||
    (inFlight ? "Researching…" : streamTerminal === "failed" ? "Stopped" : "Ready");

  const compactStatus = streamError?.trim() || headerStatus;

  const tickElapsed = inFlight && !streamEndedAt;
  const elapsed = useElapsedLabel(tickElapsed, streamStartedAt, streamEndedAt);
  const title = inFlight ? "Thinking..." : `Thought for ${elapsed}`;
  const detail = inFlight ? "" : streamError?.trim();

  return (
    <div className={cn("mb-2", className)}>
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left transition-colors hover:bg-zinc-900/40"
        aria-expanded={open}
        aria-label={open ? "Hide thinking status" : "Show thinking status"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
        )}
        <span
          className={cn(
            "text-sm font-medium tracking-tight",
            inFlight ? "text-zinc-100 chat-thinking-title" : "text-zinc-300",
          )}
        >
          {title}
        </span>
        {detail ? (
          <span className="min-w-0 flex-1 truncate text-xs text-zinc-500">{detail}</span>
        ) : (
          <span className="flex-1" aria-hidden />
        )}
        {inFlight ? (
          <span className="shrink-0 text-[11px] tabular-nums text-zinc-500">
            {elapsed}
          </span>
        ) : null}
      </button>
      {open ? (
        <p className="px-7 py-1 text-xs text-zinc-500">{detail || title}</p>
      ) : null}
    </div>
  );
}

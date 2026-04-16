export type ChatStreamStep = {
  id: string;
  label: string;
  state: "running" | "completed" | "failed";
  /** Optional right-aligned metadata from server events (counts, source labels, etc.). */
  meta?: string;
};

export type ChatStreamActivityLine = {
  id: string;
  message: string;
  meta?: string;
};

export type ChatStreamTerminal = "none" | "completed" | "failed";

export type ChatStreamUiSnapshot = {
  answer: string;
  statusLabel?: string;
  steps: ChatStreamStep[];
  /** Chronological status lines derived only from `assistant_status` SSE payloads. */
  activityLines: ChatStreamActivityLine[];
  streamError?: string;
  /** Present when terminal is failed (e.g. aborted vs API error). */
  failureCode?: string;
  terminal: ChatStreamTerminal;
};

type InternalStep = {
  label: string;
  state: ChatStreamStep["state"];
  meta?: string;
};

function parseSseBlocks(buffer: string): { blocks: string[]; rest: string } {
  const norm = buffer.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const parts = norm.split("\n\n");
  const rest = parts.pop() ?? "";
  return { blocks: parts, rest };
}

function parseOneBlock(block: string): { event: string; data: unknown } | null {
  const lines = block.split("\n");
  let eventName = "message";
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).replace(/^\s/, ""));
    }
  }
  if (dataLines.length === 0) return null;
  const joined = dataLines.join("\n");
  try {
    return { event: eventName, data: JSON.parse(joined) as unknown };
  } catch {
    return null;
  }
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function formatServerMeta(meta: unknown): string | undefined {
  if (meta == null) return undefined;
  if (typeof meta === "string") return meta.trim() || undefined;
  if (typeof meta === "number" || typeof meta === "boolean") {
    return String(meta);
  }
  if (typeof meta === "object" && !Array.isArray(meta)) {
    const o = meta as Record<string, unknown>;
    const parts = Object.entries(o)
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
      .slice(0, 4);
    const joined = parts.join(" · ");
    return joined || undefined;
  }
  return undefined;
}

/**
 * Reads an SSE body from Groq chat (/api/chat with streamFormat: "sse").
 * Handles chunk splits; throttles onSnapshot (~20Hz by default); always flushes on terminal events.
 */
/** Maps an SSE UI snapshot to AI bubble fields. Returns null = remove the bubble. */
export type ChatStreamBubblePatch = {
  isLoading: boolean;
  text: string;
  streamStatusLabel?: string;
  streamSteps?: ChatStreamStep[];
  streamActivityLines?: ChatStreamActivityLine[];
  streamError?: string;
  streamTerminal: ChatStreamTerminal;
  streamFailureCode?: string;
  streamEndedAt?: string;
};

export function sseSnapshotToBubblePatch(
  snap: ChatStreamUiSnapshot,
): ChatStreamBubblePatch | null {
  const streamEndedAt =
    snap.terminal !== "none" ? new Date().toISOString() : undefined;

  if (snap.terminal === "failed") {
    if (!snap.answer.trim() && snap.failureCode !== "aborted") {
      return null;
    }
    const text = snap.answer.trim() || snap.answer;
    return {
      isLoading: false,
      text,
      streamStatusLabel: snap.statusLabel,
      streamSteps: snap.steps.length > 0 ? snap.steps : undefined,
      streamActivityLines:
        snap.activityLines.length > 0 ? snap.activityLines : undefined,
      streamError:
        snap.failureCode === "aborted" ? undefined : snap.streamError,
      streamTerminal: "failed",
      streamFailureCode: snap.failureCode,
      streamEndedAt,
    };
  }

  if (snap.terminal === "completed") {
    const trimmed = snap.answer.trim();
    if (!trimmed) return null;
    return {
      isLoading: false,
      text: trimmed,
      streamStatusLabel: snap.statusLabel,
      streamSteps: snap.steps.length > 0 ? snap.steps : undefined,
      streamActivityLines:
        snap.activityLines.length > 0 ? snap.activityLines : undefined,
      streamError: undefined,
      streamTerminal: "completed",
      streamEndedAt,
    };
  }

  return {
    isLoading: false,
    text: snap.answer,
    streamStatusLabel: snap.statusLabel,
    streamSteps: snap.steps.length > 0 ? snap.steps : undefined,
    streamActivityLines:
      snap.activityLines.length > 0 ? snap.activityLines : undefined,
    streamError: undefined,
    streamTerminal: "none",
  };
}

export async function consumeChatSseBody(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  options: {
    throttleMs?: number;
    onSnapshot: (snap: ChatStreamUiSnapshot) => void;
  },
): Promise<ChatStreamUiSnapshot> {
  const throttleMs = options.throttleMs ?? 50;
  let buffer = "";
  const decoder = new TextDecoder();
  let answer = "";
  let statusLabel: string | undefined;
  const stepOrder: string[] = [];
  const stepMap = new Map<string, InternalStep>();
  const activityLines: ChatStreamActivityLine[] = [];
  let activitySeq = 0;
  let streamError: string | undefined;
  let failureCode: string | undefined;
  let terminal: ChatStreamUiSnapshot["terminal"] = "none";

  const buildSnapshot = (): ChatStreamUiSnapshot => ({
    answer,
    statusLabel,
    steps: stepOrder.map((id) => {
      const s = stepMap.get(id)!;
      return {
        id,
        label: s.label,
        state: s.state,
        meta: s.meta,
      };
    }),
    activityLines: [...activityLines],
    streamError,
    failureCode,
    terminal,
  });

  let lastFlush = 0;
  let flushTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingFlush = false;

  const flushNow = () => {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    pendingFlush = false;
    lastFlush = performance.now();
    options.onSnapshot(buildSnapshot());
  };

  const scheduleFlush = (immediate: boolean) => {
    if (immediate) {
      flushNow();
      return;
    }
    const now = performance.now();
    if (now - lastFlush >= throttleMs) {
      flushNow();
      return;
    }
    pendingFlush = true;
    if (flushTimer) return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      if (pendingFlush) flushNow();
    }, throttleMs - (now - lastFlush));
  };

  const applyEvent = (eventName: string, data: unknown) => {
    const d = asRecord(data);
    switch (eventName) {
      case "assistant_status": {
        const label = d?.label;
        if (typeof label === "string" && label.trim()) {
          const trimmed = label.trim();
          statusLabel = trimmed;
          const lineMeta = formatServerMeta(d?.meta);
          const last = activityLines[activityLines.length - 1];
          if (!last || last.message !== trimmed || last.meta !== lineMeta) {
            activityLines.push({
              id: `as-${++activitySeq}`,
              message: trimmed,
              meta: lineMeta,
            });
          }
        }
        break;
      }
      case "step_started": {
        const id = d?.id;
        const label = d?.label;
        if (typeof id === "string" && id) {
          if (!stepMap.has(id)) stepOrder.push(id);
          stepMap.set(id, {
            label: typeof label === "string" ? label : id,
            state: "running",
            meta: formatServerMeta(d?.meta),
          });
        }
        break;
      }
      case "step_completed": {
        const id = d?.id;
        if (typeof id === "string" && stepMap.has(id)) {
          const cur = stepMap.get(id)!;
          const doneMeta = formatServerMeta(d?.meta) ?? cur.meta;
          stepMap.set(id, {
            ...cur,
            state: "completed",
            meta: doneMeta,
          });
        }
        break;
      }
      case "answer_delta": {
        const text = d?.text;
        if (typeof text === "string" && text.length > 0) {
          answer += text;
        }
        break;
      }
      case "run_completed": {
        terminal = "completed";
        break;
      }
      case "run_failed": {
        terminal = "failed";
        const code = d?.code;
        failureCode = typeof code === "string" ? code : undefined;
        const msg = d?.message;
        streamError =
          typeof msg === "string" && msg.trim()
            ? msg.trim()
            : "Something went wrong";
        for (const id of stepOrder) {
          const s = stepMap.get(id);
          if (s?.state === "running") {
            stepMap.set(id, { ...s, state: "failed" });
          }
        }
        break;
      }
      default:
        break;
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (value?.byteLength) {
        buffer += decoder.decode(value, { stream: true });
      }
      if (done) {
        buffer += decoder.decode();
      }

      const { blocks, rest } = parseSseBlocks(buffer);
      buffer = rest;

      let sawTerminal = false;
      for (const block of blocks) {
        const parsed = parseOneBlock(block);
        if (!parsed) continue;
        applyEvent(parsed.event, parsed.data);
        if (parsed.event === "run_completed" || parsed.event === "run_failed") {
          sawTerminal = true;
        }
      }

      if (sawTerminal) {
        flushNow();
      } else if (blocks.length > 0) {
        scheduleFlush(false);
      }

      if (done) break;
    }
  } finally {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    if (pendingFlush) {
      flushNow();
    }
  }

  return buildSnapshot();
}

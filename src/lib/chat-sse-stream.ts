import { groqChatStream } from "@/lib/groq";

const encoder = new TextEncoder();

function sseFrame(event: string, data: unknown): Uint8Array {
  const payload = JSON.stringify(data);
  return encoder.encode(`event: ${event}\ndata: ${payload}\n\n`);
}

async function readGroqChunk(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  signal: AbortSignal | undefined,
): Promise<ReadableStreamReadResult<Uint8Array>> {
  if (!signal) {
    return reader.read();
  }
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      reader.cancel().catch(() => {});
      reject(new DOMException("Aborted", "AbortError"));
    };
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
    reader
      .read()
      .then((r) => {
        signal.removeEventListener("abort", onAbort);
        resolve(r);
      })
      .catch((e) => {
        signal.removeEventListener("abort", onAbort);
        reject(e);
      });
  });
}

/**
 * Backend-only SSE: progress-style events + separate answer_delta events.
 * Emits run_completed or run_failed on all exit paths (including abort).
 */
export function createGroqChatSseStream(
  systemPrompt: string,
  chatMessages: { role: string; content: string }[],
  signal?: AbortSignal,
): ReadableStream<Uint8Array> {
  let groqReader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  return new ReadableStream({
    async start(controller) {
      const safeEnqueue = (bytes: Uint8Array) => {
        try {
          controller.enqueue(bytes);
        } catch {
          // Consumer closed; ignore
        }
      };

      const terminal = (event: "run_completed" | "run_failed", data: unknown) => {
        safeEnqueue(sseFrame(event, data));
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      try {
        safeEnqueue(
          sseFrame("assistant_status", {
            phase: "thinking",
            label: "Thinking…",
          }),
        );

        safeEnqueue(
          sseFrame("step_started", {
            id: "model_completion",
            label: "Generating response",
          }),
        );

        const groqStream = await groqChatStream(systemPrompt, chatMessages);
        groqReader = groqStream.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await readGroqChunk(groqReader, signal);
          if (done) break;
          if (value && value.byteLength > 0) {
            const text = decoder.decode(value, { stream: true });
            if (text) {
              safeEnqueue(sseFrame("answer_delta", { text }));
            }
          }
        }

        const tail = decoder.decode();
        if (tail) {
          safeEnqueue(sseFrame("answer_delta", { text: tail }));
        }

        safeEnqueue(sseFrame("step_completed", { id: "model_completion" }));
        safeEnqueue(
          sseFrame("assistant_status", {
            phase: "complete",
            label: "Complete",
          }),
        );
        terminal("run_completed", { ok: true });
      } catch (err) {
        const aborted =
          err instanceof DOMException && err.name === "AbortError";
        if (!aborted) {
          console.error("[Groq SSE]", err);
        }
        terminal("run_failed", {
          code: aborted ? "aborted" : "error",
          message: aborted
            ? "Request aborted"
            : "AI request failed. Please try again.",
        });
      }
    },
    cancel() {
      groqReader?.cancel().catch(() => {});
    },
  });
}

import { NextRequest } from "next/server";
import { NEUROSCIENCE_SYSTEM_PROMPT } from "@/lib/neuroscience-system-prompt";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json();

    const ollamaUrl = process.env.OLLAMA_API_URL;
    const ollamaModel =
      model || process.env.OLLAMA_MODEL_NEUROSCIENCE || "llama3.2";

    if (!ollamaUrl) {
      return new Response(
        JSON.stringify({ error: "OLLAMA_API_URL is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Prepend the system prompt server-side so it never reaches the client bundle
    const fullMessages = [
      { role: "system", content: NEUROSCIENCE_SYSTEM_PROMPT },
      ...messages,
    ];

    const ollamaResponse = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel,
        messages: fullMessages,
        stream: true,
        options: {
          temperature: 0.4,
          num_predict: 600,
        },
      }),
    });

    if (!ollamaResponse.ok || !ollamaResponse.body) {
      return new Response(
        JSON.stringify({ error: "Failed to connect to Ollama" }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    // Transform NDJSON from Ollama → plain text stream for the client
    const reader = ollamaResponse.body.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async pull(controller) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }

          const chunk = decoder.decode(value, { stream: true });
          // Ollama sends NDJSON – one JSON object per line
          const lines = chunk.split("\n").filter(Boolean);

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.message?.content) {
                controller.enqueue(
                  new TextEncoder().encode(parsed.message.content),
                );
              }
              if (parsed.done) {
                controller.close();
                return;
              }
            } catch {
              // Partial JSON – skip
            }
          }
        }
      },
      cancel() {
        reader.cancel();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

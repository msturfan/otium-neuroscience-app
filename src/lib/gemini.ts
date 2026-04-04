import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function geminiChat(
  systemPrompt: string,
  userMessage: string,
  history: { role: string; content: string }[] = [],
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
    systemInstruction: systemPrompt,
  });

  const chat = model.startChat({
    history: history.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    })),
  });

  const result = await chat.sendMessage(userMessage);

  const inputTokens = result.response.usageMetadata?.promptTokenCount || 0;
  const outputTokens =
    result.response.usageMetadata?.candidatesTokenCount || 0;

  console.log(
    `[Gemini] model: ${process.env.GEMINI_MODEL} | ` +
      `in: ${inputTokens} tokens | out: ${outputTokens} tokens`,
  );

  return result.response.text();
}

export async function geminiChatStream(
  systemPrompt: string,
  messages: { role: string; content: string }[],
): Promise<ReadableStream<Uint8Array>> {
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
    systemInstruction: systemPrompt,
  });

  const history = messages.slice(0, -1).map((msg) => ({
    role: msg.role === "assistant" ? "model" : ("user" as const),
    parts: [{ text: msg.content }],
  }));

  const lastMessage = messages[messages.length - 1]?.content || "";

  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(lastMessage);

  const encoder = new TextEncoder();

  return new ReadableStream({
    async pull(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
    cancel() {
      // stream abandoned by client
    },
  });
}

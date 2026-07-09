import Groq from "groq-sdk";

const DEFAULT_MODEL = "openai/gpt-oss-120b";

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("[Groq] GROQ_API_KEY is not configured");
    throw new Error("AI service is not configured");
  }

  groqClient ??= new Groq({ apiKey });
  return groqClient;
}

export async function groqChat(
  systemPrompt: string,
  userMessage: string,
  history: { role: string; content: string }[] = [],
): Promise<string> {
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((msg) => ({
      role: (msg.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user", content: userMessage },
  ];

  const completion = await getGroqClient().chat.completions.create({
    model,
    messages,
  });

  const inputTokens = completion.usage?.prompt_tokens || 0;
  const outputTokens = completion.usage?.completion_tokens || 0;

  console.log(
    `[Groq] model: ${model} | ` +
      `in: ${inputTokens} tokens | out: ${outputTokens} tokens`,
  );

  return completion.choices[0]?.message?.content || "";
}

export async function groqChatStream(
  systemPrompt: string,
  messages: { role: string; content: string }[],
): Promise<ReadableStream<Uint8Array>> {
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  const groqMessages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((msg) => ({
      role: (msg.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
      content: msg.content,
    })),
  ];

  const stream = await getGroqClient().chat.completions.create({
    model,
    messages: groqMessages,
    stream: true,
  });

  const encoder = new TextEncoder();

  return new ReadableStream({
    async pull(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content;
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

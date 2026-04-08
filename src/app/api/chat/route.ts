import { NextRequest } from "next/server";
import { NEUROSCIENCE_SYSTEM_PROMPT } from "@/lib/neuroscience-system-prompt";
import { OTIUM_SYSTEM_PROMPT } from "@/lib/otium-system-prompt";
import { WORKOUT_SYSTEM_PROMPT } from "@/lib/workout-system-prompt";
import {
  buildWorkoutProgramSystemPrompt,
  type AthleteProfileForPrompt,
} from "@/lib/workout-program-system-prompt";
import { groqChatStream } from "@/lib/groq";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      promptType,
      athleteProfile,
    }: {
      messages: { role: string; content: string }[];
      promptType: string;
      athleteProfile?: AthleteProfileForPrompt;
    } = await req.json();

    let systemPrompt: string;
    if (promptType === "workout-program" && athleteProfile) {
      systemPrompt = buildWorkoutProgramSystemPrompt(athleteProfile);
    } else if (promptType === "workout") {
      systemPrompt = WORKOUT_SYSTEM_PROMPT;
    } else if (promptType === "otium") {
      systemPrompt = OTIUM_SYSTEM_PROMPT;
    } else {
      systemPrompt = NEUROSCIENCE_SYSTEM_PROMPT;
    }

    // Filter to only user/assistant messages for Gemini history
    const chatMessages = messages.filter(
      (m: { role: string }) => m.role === "user" || m.role === "assistant",
    );

    const stream = await groqChatStream(systemPrompt, chatMessages);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Groq Error] Chat API:", error);
    return new Response(
      JSON.stringify({ error: "AI request failed. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

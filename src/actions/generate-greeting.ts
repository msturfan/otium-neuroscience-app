"use server";

import { geminiChat } from "@/lib/gemini";

/**
 * Generates a concise greeting/confirmation message when a note is saved
 */
export async function generateNoteGreeting(
  noteText: string,
  userLocalHour?: number, // User's local hour (0-23) from client
): Promise<string | null> {
  try {
    // Get current time of day for context
    // Use user's local time if provided, otherwise fall back to server time
    const hour =
      userLocalHour !== undefined ? userLocalHour : new Date().getHours();
    let timeGreeting = "";
    let timeDescription = "";

    if (hour >= 5 && hour < 12) {
      timeGreeting = "morning";
      timeDescription = `It's ${hour}:00 in the morning`;
    } else if (hour >= 12 && hour < 17) {
      timeGreeting = "afternoon";
      timeDescription = `It's ${hour}:00 in the afternoon`;
    } else if (hour >= 17 && hour < 22) {
      timeGreeting = "evening";
      timeDescription = `It's ${hour}:00 in the evening`;
    } else {
      timeGreeting = "night";
      timeDescription = `It's ${hour}:00 at night`;
    }

    // Send full note context so the model can consider all user content.
    const normalizedNote = noteText.replace(/\s+/g, " ").trim();
    const noteContext = normalizedNote;

    // Create a prompt for a friendly, personalized greeting
    const prompt = `Generate a warm, friendly confirmation message that:
1. Confirms the note was saved successfully
2. Includes a personalized greeting appropriate for ${timeGreeting} (${timeDescription})
3. Acknowledges 1-2 specific ideas from the user's note (not only the first sentence)
4. Is warm, natural, and encouraging

User's note content: "${noteContext}"

Important:
- Use the same language as the user's note.
- If the note contains multiple bullet points/ideas, pick a meaningful one (preferably not the very first item when possible).
- Do not invent details that are not in the note.
- Keep the response concise and friendly.
- Return only the greeting message, nothing else.`;

    const systemPrompt =
      "You generate warm, friendly confirmation messages when a user saves a note. Be concise and natural.";

    const rawGreeting = await geminiChat(systemPrompt, prompt);

    if (!rawGreeting) {
      return null;
    }

    // Clean up the greeting - remove quotes, extra whitespace, etc.
    const cleanGreeting = rawGreeting
      .replace(/^["']|["']$/g, "")
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return cleanGreeting || null;
  } catch (error) {
    console.error("[Gemini Error] generating greeting:", error);
    return null;
  }
}

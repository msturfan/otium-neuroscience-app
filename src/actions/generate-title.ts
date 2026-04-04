"use server";

import { geminiChat } from "@/lib/gemini";

export async function generateNoteTitle(
  noteText: string,
): Promise<string | null> {
  try {
    // Truncate note if too long (models have token limits)
    const truncatedText = noteText.slice(0, 1000);

    // Clean up the text
    const cleanText = truncatedText.trim().replace(/\n+/g, " ");

    const prompt = `Summarize the user's daily's message (and optionally the AI's first reply) in 5-7 words, to serve as the conversation title. Use the same language as the user. The title should reflect the main topic and be easy to scan in a list.
    Create a short title (MAXIMUM 5 words, prefer 3-4 words) for this note. Return ONLY the title words, nothing else. No quotes, no punctuation, no explanations:\n\n${cleanText}`;

    const systemPrompt =
      "You generate short titles for notes. Return only the title, nothing else.";

    const title = await geminiChat(systemPrompt, prompt);

    if (!title?.trim()) {
      return null;
    }

    // Clean up the title
    let cleanTitle = title
      .replace(/^["']|["']$/g, "")
      .replace(/[.!?]$/g, "")
      .replace(/^title:?\s*/i, "")
      .trim();

    // Extract just the title if model added extra text
    const lines = cleanTitle.split("\n");
    cleanTitle = lines[0].trim();

    // Split into words and enforce maximum 5 words
    const words = cleanTitle.split(/\s+/).filter((word: string) => word.length > 0);

    if (words.length > 5) {
      cleanTitle = words.slice(0, 5).join(" ");
    } else {
      cleanTitle = words.join(" ");
    }

    // Also limit by character length (safety check)
    if (cleanTitle.length > 40) {
      const truncatedWords = cleanTitle.substring(0, 40).split(/\s+/);
      cleanTitle = truncatedWords.slice(0, -1).join(" ");
    }

    // Capitalize first letter of each word (title case)
    cleanTitle = cleanTitle
      .split(" ")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    return cleanTitle || null;
  } catch (error) {
    console.error("[Gemini Error] generating title:", error);
    return null;
  }
}

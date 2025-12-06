"use server";

export async function generateNoteTitle(
  noteText: string,
): Promise<string | null> {
  try {
    // Truncate note if too long (models have token limits)
    const truncatedText = noteText.slice(0, 1000);

    // Clean up the text
    const cleanText = truncatedText.trim().replace(/\n+/g, " ");

    const ollamaUrl = process.env.OLLAMA_API_URL;
    const model = process.env.OLLAMA_MODEL_TITLE;

    if (!ollamaUrl || !model) {
      console.error("Ollama configuration missing. Set OLLAMA_API_URL and OLLAMA_MODEL_TITLE in .env.local");
      return null; // Fail silently or throw error
    }

    // Create the prompt - be very strict about length
    const prompt = `Summarize the user's daily's message (and optionally the AI’s first reply) in 5-7 words, to serve as the conversation title. Use the same language as the user. The title should reflect the main topic and be easy to scan in a list.
    Create a short title (MAXIMUM 5 words, prefer 3-4 words) for this note. Return ONLY the title words, nothing else. No quotes, no punctuation, no explanations:\n\n${cleanText}`;

    // Call Ollama API
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false, // We want the full response, not streaming
        options: {
          temperature: 0.5, // Lower temperature for more focused responses
          num_predict: 12, // Reduced tokens - force shorter output
        },
      }),
    });

    if (!response.ok) {
      console.error("Ollama API error:", response.statusText);
      return null;
    }

    const data = await response.json();
    const title = data.response?.trim();

    if (!title) {
      return null;
    }

    // Clean up the title
    let cleanTitle = title
      .replace(/^["']|["']$/g, "") // Remove quotes
      .replace(/[.!?]$/g, "") // Remove trailing punctuation
      .replace(/^title:?\s*/i, "") // Remove "Title:" prefix if model added it
      .trim();

    // Extract just the title if model added extra text
    const lines = cleanTitle.split("\n");
    cleanTitle = lines[0].trim();

    // Split into words and enforce maximum 5 words
    const words = cleanTitle.split(/\s+/).filter((word) => word.length > 0);

    // Take only first 5 words maximum
    if (words.length > 5) {
      cleanTitle = words.slice(0, 5).join(" ");
    } else {
      cleanTitle = words.join(" ");
    }

    // Also limit by character length (safety check)
    if (cleanTitle.length > 40) {
      // If still too long, truncate at word boundary
      const truncatedWords = cleanTitle.substring(0, 40).split(/\s+/);
      cleanTitle = truncatedWords.slice(0, -1).join(" "); // Remove last partial word
    }

    // Capitalize first letter of each word (title case)
    cleanTitle = cleanTitle
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    return cleanTitle || null;
  } catch (error) {
    console.error("Error generating title with Ollama:", error);
    // Fallback to null - will use simple title extraction
    return null;
  }
}

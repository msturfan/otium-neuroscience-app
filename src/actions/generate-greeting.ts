"use server";

/**
 * Generates a concise greeting/confirmation message when a note is saved
 * Uses qwen2:1.5b model via Ollama
 */
export async function generateNoteGreeting(
  noteText: string,
  userLocalHour?: number, // User's local hour (0-23) from client
): Promise<string | null> {
  try {
    const ollamaUrl = process.env.OLLAMA_API_URL;
    const model = process.env.OLLAMA_MODEL_GREETING || "qwen2:1.5b";

    console.log("generateNoteGreeting called with:", {
      ollamaUrl,
      model,
      noteTextLength: noteText.length,
    });

    if (!ollamaUrl) {
      console.error(
        "Ollama configuration missing. Set OLLAMA_API_URL in .env.local",
      );
      return null;
    }

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
- If the note contains multiple bullet points/ideas, pick a meaningful one (preferably not the very first item when possible).
- Do not invent details that are not in the note.
- Keep the response concise and friendly.
- Use the same language as the user's note if possible.
- Return only the greeting message, nothing else.`;

    // Call Ollama API
    console.log("Calling Ollama API:", `${ollamaUrl}/api/generate`);
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.8, // Higher for more natural, varied greetings
        },
      }),
    });

    console.log(
      "Ollama API response status:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => "Could not read error");
      console.error("Ollama API error:", response.statusText, errorText);
      return null;
    }

    const data = await response.json();
    console.log(
      "Ollama API response data:",
      JSON.stringify(data).substring(0, 200),
    );
    const greeting = data.response?.trim();

    if (!greeting) {
      console.error("No greeting in response. Full data:", data);
      return null;
    }

    console.log("Raw greeting from Ollama:", greeting);

    // Clean up the greeting - remove quotes, extra whitespace, etc.
    const cleanGreeting = greeting
      .replace(/^["']|["']$/g, "") // Remove quotes
      .replace(/\n+/g, " ") // Replace newlines with spaces
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    return cleanGreeting || null;
  } catch (error) {
    console.error("Error generating greeting with Ollama:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    // Return a simple fallback greeting
    return null;
  }
}

"use server";

export async function generateNoteSuggestions(
  noteText: string,
): Promise<{ suggestions: string[]; errorMessage: string | null }> {
  try {
    // Check if note is too short
    if (!noteText.trim() || noteText.trim().length < 20) {
      return {
        suggestions: [],
        errorMessage:
          "Write a few lines about your day first, then I can suggest improvements.",
      };
    }

    // Truncate note if too long
    const truncatedText = noteText.slice(0, 2000);

    // Clean up the text
    const cleanText = truncatedText.trim().replace(/\n+/g, " ");

    // Create the prompt with safety guidelines
    const prompt = `You are a helpful assistant that reviews daily notes and suggests improvements. Analyze the following daily note and provide 2-6 short, actionable suggestions for what the user could add to make their note more complete.

Focus on these areas if missing or under-described:
- Physical health (sleep, energy, exercise, diet)
- Mental state / mood
- Progress toward personal goals (fitness, learning, career, habits)
- Notable events, challenges, or wins

Rules:
- Be encouraging and supportive, not critical
- Use short, clear bullet points (one sentence each)
- Only suggest adding content, never rewrite or change meaning
- If the note contains explicit sexual content, violent language, or illegal activities, gently suggest keeping the note focused on safe, everyday life topics instead
- Return ONLY the suggestions as a bulleted list, nothing else

Daily note to review:
${cleanText}

Suggestions:`;

    // Get configuration from environment (required, no fallbacks)
    const ollamaUrl = process.env.OLLAMA_API_URL;
    const model = process.env.OLLAMA_MODEL_SUGGESTIONS;

    if (!ollamaUrl || !model) {
      console.error("Ollama configuration missing. Set OLLAMA_API_URL and OLLAMA_MODEL_SUGGESTIONS in .env.local");
      return {
        suggestions: [],
        errorMessage: "AI service is not configured. Please contact support.",
      };
    }

    // Call Ollama API
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
          temperature: 0.6, // Balanced creativity
          num_predict: 200, // Enough for 2-6 suggestions
        },
      }),
    });

    if (!response.ok) {
      console.error("Ollama API error:", response.statusText);
      return {
        suggestions: [],
        errorMessage: "Failed to generate suggestions. Please try again.",
      };
    }

    const data = await response.json();
    const responseText = data.response?.trim();

    if (!responseText) {
      return {
        suggestions: [],
        errorMessage: "No suggestions generated. Please try again.",
      };
    }

    // Parse suggestions from the response
    // Handle different formats: bullet points, numbered lists, or plain text
    let suggestions: string[] = [];

    // Try to extract bullet points
    const bulletPattern = /[-•*]\s*(.+?)(?=\n[-•*]|\n\n|$)/g;
    const matches = responseText.matchAll(bulletPattern);

    for (const match of matches) {
      const suggestion = match[1].trim();
      if (suggestion && suggestion.length > 10) {
        suggestions.push(suggestion);
      }
    }

    // If no bullet points found, try numbered list
    if (suggestions.length === 0) {
      const numberedPattern = /\d+[.)]\s*(.+?)(?=\n\d+[.)]|\n\n|$)/g;
      const numberedMatches = responseText.matchAll(numberedPattern);
      for (const match of numberedMatches) {
        const suggestion = match[1].trim();
        if (suggestion && suggestion.length > 10) {
          suggestions.push(suggestion);
        }
      }
    }

    // If still no structured format, split by newlines and clean
    if (suggestions.length === 0) {
      suggestions = responseText
        .split("\n")
        .map((line: string) => line.trim())
        .filter(
          (line: string) =>
            line.length > 10 &&
            !line.toLowerCase().includes("suggestion") &&
            !line.toLowerCase().includes("note:"),
        )
        .slice(0, 6); // Max 6 suggestions
    }

    // Limit to 6 suggestions max
    suggestions = suggestions.slice(0, 6);

    // Clean each suggestion
    suggestions = suggestions.map((s) =>
      s
        .replace(/^[-•*]\s*/, "") // Remove bullet
        .replace(/^\d+[.)]\s*/, "") // Remove number
        .trim(),
    );

    // Filter out empty or too short suggestions
    suggestions = suggestions.filter((s) => s.length >= 15);

    if (suggestions.length === 0) {
      return {
        suggestions: [],
        errorMessage: "Could not generate suggestions. Please try again.",
      };
    }

    return {
      suggestions,
      errorMessage: null,
    };
  } catch (error) {
    console.error("Error generating suggestions with Ollama:", error);
    return {
      suggestions: [],
      errorMessage:
        "An error occurred while generating suggestions. Please try again.",
    };
  }
}


"use server";

import { NEUROSCIENCE_SYSTEM_PROMPT } from "@/lib/neuroscience-system-prompt";

export async function generateNeuroscienceAnswer(
  questionText: string,
): Promise<{ answer: string | null; errorMessage: string | null }> {
  try {
    // Check if question is too short
    if (!questionText.trim() || questionText.trim().length < 10) {
      return {
        answer: null,
        errorMessage: "Please ask a question about neuroplasticity or neuroscience.",
      };
    }

    // Truncate question if too long
    const truncatedText = questionText.slice(0, 1000);

    // Clean up the text
    const cleanText = truncatedText.trim().replace(/\n+/g, " ");

    const prompt = `${NEUROSCIENCE_SYSTEM_PROMPT}

User's question:
${cleanText}

Answer (follow the response structure):`;

    // Get configuration from environment
    const ollamaUrl = process.env.OLLAMA_API_URL;
    const model = process.env.OLLAMA_MODEL_NEUROSCIENCE;

    if (!ollamaUrl || !model) {
      console.error("Ollama configuration missing. Set OLLAMA_API_URL and OLLAMA_MODEL_NEUROSCIENCE in .env.local");
      return {
        answer: null,
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
          temperature: 0.4, // Lower temperature for more factual, focused responses
          num_predict: 450, // Room for structured, readable sections
        },
      }),
    });

    if (!response.ok) {
      console.error("Ollama API error:", response.statusText);
      return {
        answer: null,
        errorMessage: "Failed to generate answer. Please try again.",
      };
    }

    const data = await response.json();
    const answerText = data.response?.trim();

    if (!answerText) {
      return {
        answer: null,
        errorMessage: "No answer generated. Please try again.",
      };
    }

    // Clean up the answer
    let cleanAnswer = answerText
      .replace(/^["']|["']$/g, "") // Remove quotes
      .replace(/\r\n/g, "\n")
      .trim();

    // Remove common prefixes that models might add
    const prefixesToRemove = [
      "Answer:",
      "Response:",
      "Here's",
      "Here is",
      "The answer is",
      "Based on",
    ];

    for (const prefix of prefixesToRemove) {
      const regex = new RegExp(`^${prefix}\\b`, "i");
      if (regex.test(cleanAnswer)) {
        cleanAnswer = cleanAnswer.replace(regex, "").trim();
        // Remove any leading colon or dash
        cleanAnswer = cleanAnswer.replace(/^[:-\s]+/, "").trim();
        break;
      }
    }

    // Ensure answer is not too short or too long
    if (cleanAnswer.length < 20) {
      return {
        answer: null,
        errorMessage: "Answer too short. Please try rephrasing your question.",
      };
    }

    if (cleanAnswer.length > 500) {
      // Truncate if too long
      cleanAnswer = cleanAnswer.substring(0, 500).trim() + "...";
    }

    return {
      answer: cleanAnswer,
      errorMessage: null,
    };
  } catch (error) {
    console.error("Error generating neuroscience answer with Ollama:", error);
    return {
      answer: null,
      errorMessage: "An error occurred while generating answer. Please try again.",
    };
  }
}

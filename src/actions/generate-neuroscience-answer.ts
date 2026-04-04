"use server";

import { NEUROSCIENCE_SYSTEM_PROMPT } from "@/lib/neuroscience-system-prompt";
import { groqChat } from "@/lib/groq";

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

    const userMessage = `User's question:
${cleanText}

Answer (follow the response structure):`;

    const answerText = await groqChat(NEUROSCIENCE_SYSTEM_PROMPT, userMessage);

    if (!answerText?.trim()) {
      return {
        answer: null,
        errorMessage: "No answer generated. Please try again.",
      };
    }

    // Clean up the answer
    let cleanAnswer = answerText
      .replace(/^["']|["']$/g, "")
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
      cleanAnswer = cleanAnswer.substring(0, 500).trim() + "...";
    }

    return {
      answer: cleanAnswer,
      errorMessage: null,
    };
  } catch (error) {
    console.error("[Groq Error] generating neuroscience answer:", error);
    return {
      answer: null,
      errorMessage: "An error occurred while generating answer. Please try again.",
    };
  }
}

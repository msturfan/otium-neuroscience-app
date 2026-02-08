"use server";

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

    // Create the prompt focused on neuroplasticity and neuroscience
    const prompt = `You are an expert neuroscience assistant specializing in neuroplasticity. You MUST provide answers that are grounded in neuroscience research and focus on brain function, neural mechanisms, and neuroplasticity principles.

CRITICAL: Your answer MUST be based on neuroscience. Connect every response to brain function, neural pathways, neuroplasticity, or related neuroscience concepts. Even if the question seems general, frame your answer through a neuroscience lens.

Rules:
- ALWAYS provide answers from a neuroscience perspective - explain how the brain works, neural mechanisms, or neuroplasticity principles
- Focus on neuroplasticity, brain adaptation, neural pathways, synaptic plasticity, brain regions, neurotransmitters, and related neuroscience concepts
- Provide direct, factual answers based on neuroscience research and scientific evidence
- Keep answers concise and to the point (2-4 sentences maximum, no fluff)
- Connect general questions to neuroscience concepts when possible (e.g., learning → neuroplasticity, memory → hippocampus and neural pathways)
- Do NOT provide medical advice, diagnoses, or treatment recommendations
- Do NOT provide information about illegal activities, drugs, or harmful practices
- If the question is not related to neuroscience/neuroplasticity, find a neuroscience angle or politely redirect to neuroscience topics
- If asked about illegal or harmful topics, decline politely and suggest legitimate neuroscience learning instead
- Use simple language but maintain scientific accuracy
- Return ONLY the answer, no greetings, no disclaimers unless necessary

User's question:
${cleanText}

Answer (from a neuroscience perspective):`;

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
          num_predict: 300, // Enough for a concise answer (2-4 sentences)
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
      .replace(/\n+/g, " ") // Replace newlines with spaces
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
      if (cleanAnswer.toLowerCase().startsWith(prefix.toLowerCase())) {
        cleanAnswer = cleanAnswer.substring(prefix.length).trim();
        // Remove any leading colon or dash
        cleanAnswer = cleanAnswer.replace(/^[:-\s]+/, "").trim();
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

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
    const prompt = `You are a neuroscience-informed behavioral change assistant specializing in neuroplasticity, psychology, habit formation, and cognitive optimization.

Your primary objective is to help users create real, measurable brain and behavior change using evidence-based principles from neuroscience, psychology, and behavioral science.

CORE OPERATING PRINCIPLES:

1. Solution-Oriented Only
Do not provide abstract theory unless necessary. Translate science into clear, realistic actions the user can implement immediately.

2. Evidence-Based Responses
Prioritize well-supported concepts such as:
- Neuroplasticity mechanisms (repetition, attention, emotional salience, sleep, novelty)
- Cognitive behavioral strategies
- Exposure therapy principles
- Dopamine regulation through effort-based reward
- Habit formation and behavioral conditioning
- Stress regulation and nervous system recovery
- Executive function training
- Metacognition

Avoid speculative neuroscience or pop-psychology myths.

3. No Sugarcoating
Be honest and grounded. Do not validate harmful avoidance patterns. If change requires discomfort, discipline, or time, state it clearly.

4. Practical Over Motivational
Do not act like a motivational speaker. Act like a high-level behavioral strategist.

5. Always Move Toward Action
Whenever possible, provide:
- What is happening in the brain
- Why it matters
- Exactly what the user should do next
- What results they should expect
- Typical timeline for neural adaptation

---

SAFETY + LEGAL GUARDRAILS:

You must refuse any request involving:
- Illegal activity
- Drug acquisition or misuse
- Self-harm guidance
- Harm toward others
- Medical diagnosis
- Prescription recommendations

If a user asks for disallowed content:
Respond briefly and calmly:
"I can’t help with that. But I can help you find safe, science-based ways to improve your situation."

Immediately redirect toward a constructive alternative.
Never shame the user.
Never sound like a legal disclaimer.

---

MENTAL HEALTH BOUNDARY:

You are not a replacement for licensed medical or mental health professionals.

If a user shows signs of severe depression, suicidality, trauma crisis, addiction risk, or psychological instability:
Encourage professional support in a calm, normal tone — not alarmist.

Example:
"This sounds heavier than what someone should handle alone. A licensed professional could give you the level of support this deserves."

Do NOT over-trigger this rule for normal stress or life problems.

---

CONVERSATIONAL ENGINE (CRITICAL):

Always ask a high-quality follow-up question.

Your goal is to create an ongoing self-reflection loop that drives neuroplastic change.

Follow-up questions must be:
- Specific
- Insight-provoking
- Action-oriented
- Easy to answer

Avoid generic questions like:
"How does that make you feel?"

Prefer:
"What situations trigger this most consistently?"
"When is the last time this pattern showed up?"
"What have you already tried?"
"What usually happens right before the behavior?"

Ask ONE strong question at a time.

---

RESPONSE STRUCTURE:

Default format:
1. Direct Insight
2. Science Translation
3. Tactical Steps
4. Expectation Setting
5. Follow-Up Question

Keep responses clear, grounded, and efficient.
Avoid long essays unless the user asks for deep explanation.

---

TONE:
- Intelligent but human
- Calm, grounded authority
- Never robotic
- Never overly enthusiastic
- Never clinical to the point of coldness

Write like a trusted expert guiding someone through real change.

---

MISSION:
Your role is not just to answer questions.
Your role is to help rewire patterns.

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

"use server";

import { prisma } from "@/db/prisma";
import { getUser } from "@/auth/server";
import { getLastWeekStart } from "@/lib/timezone-utils";
import { groqChat } from "@/lib/groq";

/**
 * Generates a weekly report for a user based on their notes from the last 7 days
 */
export async function generateWeeklyReport(
  userId: string,
  weekStart: Date,
): Promise<{ reportText: string | null; errorMessage: string | null }> {
  try {
    // Get user's timezone (default to UTC if not set)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });

    const userTimezone = user?.timezone || "UTC";

    // Calculate the date range for the last 7 days in user's timezone
    // weekStart is Sunday 9 AM in user's timezone
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Fetch all notes from the last 7 days
    const notes = await prisma.note.findMany({
      where: {
        authorId: userId,
        createdAt: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        text: true,
        title: true,
        createdAt: true,
      },
    });

    // Check if user has at least 2 notes
    if (notes.length < 2) {
      return {
        reportText: null,
        errorMessage: "You need at least 2 notes in the past week to generate a report.",
      };
    }

    // Prepare notes text for the AI
    const notesText = notes
      .map((note) => {
        const date = new Date(note.createdAt).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          timeZone: userTimezone,
        });
        return `[${date}] ${note.title || "Untitled"}\n${note.text}`;
      })
      .join("\n\n---\n\n");

    // Truncate if too long (keep last 4000 characters to stay within token limits)
    const truncatedNotes = notesText.length > 4000 
      ? notesText.slice(-4000) 
      : notesText;

    // Create a comprehensive prompt for weekly report generation
    const prompt = `You are an expert life analyst. Analyze the following weekly notes from a user and generate a detailed, insightful weekly report.

The user has shared ${notes.length} notes from the past 7 days. Read them carefully and provide:

1. **Week Overview**: A brief summary of the week's main themes and activities
2. **Patterns & Insights**: 
   - Energy levels and mood patterns
   - Recurring themes or habits
   - Notable changes or shifts
   - Work-life balance observations
3. **Key Moments**: Highlight 2-3 significant moments or achievements
4. **Observations**: What stands out about this week compared to typical weeks (if patterns are visible)
5. **Grounded Suggestions**: 2-3 specific, actionable suggestions based on the actual content (avoid generic advice)

Rules:
- Be realistic and honest, not overly positive or negative
- Base insights on actual content, not assumptions
- Use specific examples from the notes when relevant
- Write in a warm, supportive but direct tone
- Avoid clichés and generic self-help language
- Keep the report comprehensive but readable (aim for 300-500 words)

User's notes from the past week:
${truncatedNotes}

Weekly Report:`;

    const systemPrompt =
      "You are an expert life analyst generating insightful weekly reports from user notes.";

    const reportText = await groqChat(systemPrompt, prompt);

    if (!reportText?.trim()) {
      return {
        reportText: null,
        errorMessage: "No report generated. Please try again.",
      };
    }

    // Save the report to database
    await prisma.weeklyReport.upsert({
      where: {
        userId_weekStart: {
          userId,
          weekStart,
        },
      },
      update: {
        reportText,
        generatedAt: new Date(),
      },
      create: {
        userId,
        weekStart,
        reportText,
      },
    });

    return {
      reportText,
      errorMessage: null,
    };
  } catch (error) {
    console.error("[Groq Error] generating weekly report:", error);
    return {
      reportText: null,
      errorMessage:
        "An error occurred while generating the weekly report. Please try again.",
    };
  }
}

/**
 * Get the last week's report for the authenticated user
 * Reports are generated for the week that just ended (last Sunday 9 AM)
 */
export async function getCurrentWeeklyReport(): Promise<{
  report: { reportText: string; generatedAt: Date; weekStart: Date } | null;
  errorMessage: string | null;
}> {
  try {
    const user = await getUser();
    if (!user) {
      return { report: null, errorMessage: "Not signed in" };
    }

    // Get user's timezone
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { timezone: true },
    });

    const userTimezone = userData?.timezone || "UTC";

    // Calculate last week start (Sunday 9 AM in user's timezone)
    // Reports are for the week that just ended
    const now = new Date();
    const weekStart = getLastWeekStart(now, userTimezone);

    // Fetch the report
    const report = await prisma.weeklyReport.findUnique({
      where: {
        userId_weekStart: {
          userId: user.id,
          weekStart,
        },
      },
      select: {
        reportText: true,
        generatedAt: true,
        weekStart: true,
      },
    });

    return { report, errorMessage: null };
  } catch (error) {
    console.error("Error fetching weekly report:", error);
    return {
      report: null,
      errorMessage: "Failed to fetch weekly report.",
    };
  }
}

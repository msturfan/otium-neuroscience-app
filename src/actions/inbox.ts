"use server";

import { getUser } from "@/auth/server";
import { prisma } from "@/db/prisma";
import { handleError } from "@/lib/utils";
import { getWeekStart, getLastWeekStart, formatNoteDate, shouldGenerateReport } from "@/lib/timezone-utils";
import { generateWeeklyReport } from "@/actions/generate-weekly-report";

/**
 * Get user's notes from the last 7 days and weekly report status
 * Automatically generates report if it's past Sunday 9 AM and report is missing
 */
export async function getInboxData() {
  try {
    const user = await getUser();
    if (!user) {
      return {
        notes: [],
        report: null,
        noteCount: 0,
        hasEnoughNotes: false,
        errorMessage: "Not signed in",
      };
    }

    // Get user's timezone
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { timezone: true },
    });

    const userTimezone = userData?.timezone || "UTC";

    // Calculate date range for last 7 days in user's timezone
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get current week start (Sunday 9 AM)
    const weekStart = getWeekStart(now, userTimezone);
    
    // Get last week's start (for the report we should show)
    const lastWeekStart = getLastWeekStart(now, userTimezone);

    // Fetch notes from last 7 days
    const notes = await prisma.note.findMany({
      where: {
        authorId: user.id,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        text: true,
        title: true,
        createdAt: true,
      },
    });

    // Count notes from the current week (since last Sunday 9 AM)
    const weekNotes = notes.filter(
      (note) => new Date(note.createdAt) >= weekStart,
    );
    const noteCount = weekNotes.length;
    const hasEnoughNotes = noteCount >= 2;

    // Fetch last week's report if it exists
    let report = await prisma.weeklyReport.findUnique({
      where: {
        userId_weekStart: {
          userId: user.id,
          weekStart: lastWeekStart,
        },
      },
      select: {
        reportText: true,
        generatedAt: true,
        weekStart: true,
      },
    });

    // Auto-generate report if it's past Sunday 9 AM and report is missing
    if (!report) {
      const shouldGenerate = shouldGenerateReport(now, userTimezone, null);
      
      if (shouldGenerate) {
        // Check if user has enough notes from last week
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekEnd.getDate() + 7);
        
        const lastWeekNotes = notes.filter(
          (note) => {
            const noteDate = new Date(note.createdAt);
            return noteDate >= lastWeekStart && noteDate < lastWeekEnd;
          }
        );

        if (lastWeekNotes.length >= 2) {
          // Generate the report automatically
          try {
            const result = await generateWeeklyReport(user.id, lastWeekStart);
            if (result.reportText) {
              // Fetch the newly generated report
              report = await prisma.weeklyReport.findUnique({
                where: {
                  userId_weekStart: {
                    userId: user.id,
                    weekStart: lastWeekStart,
                  },
                },
                select: {
                  reportText: true,
                  generatedAt: true,
                  weekStart: true,
                },
              });
            }
          } catch (error) {
            // Silently fail - report generation will be retried on next visit
            console.error("Auto-generation of weekly report failed:", error);
          }
        }
      }
    }

    return {
      notes: notes.map((note) => ({
        id: note.id,
        title: note.title || "Untitled",
        text: note.text,
        createdAt: note.createdAt,
        preview: note.text.slice(0, 100) + (note.text.length > 100 ? "…" : ""),
        date: formatNoteDate(note.createdAt, userTimezone),
      })),
      report,
      noteCount,
      hasEnoughNotes,
      errorMessage: null,
    };
  } catch (error) {
    return {
      notes: [],
      report: null,
      noteCount: 0,
      hasEnoughNotes: false,
      ...handleError(error),
    };
  }
}



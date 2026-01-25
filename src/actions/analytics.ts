"use server";

import { getUser } from "@/auth/server";
import { prisma } from "@/db/prisma";
import { handleError } from "@/lib/utils";

export interface DailyNoteCount {
  date: string; // YYYY-MM-DD format
  count: number;
}

export async function fetchYearlyNoteActivity(): Promise<{
  data: DailyNoteCount[];
  errorMessage: string | null;
}> {
  try {
    const user = await getUser();
    if (!user) {
      return { data: [], errorMessage: "Not signed in" };
    }

    // Get notes from the current calendar year (Jan 1 to Dec 31)
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1); // January 1
    yearStart.setHours(0, 0, 0, 0);
    
    const yearEnd = new Date(currentYear, 11, 31); // December 31
    yearEnd.setHours(23, 59, 59, 999);

    const notes = await prisma.note.findMany({
      where: {
        authorId: user.id,
        createdAt: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Group notes by date (YYYY-MM-DD)
    const dailyCounts = new Map<string, number>();

    notes.forEach((note) => {
      const date = new Date(note.createdAt);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      dailyCounts.set(dateKey, (dailyCounts.get(dateKey) || 0) + 1);
    });

    // Convert to array and sort by date
    const data: DailyNoteCount[] = Array.from(dailyCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { data, errorMessage: null };
  } catch (error) {
    return { data: [], ...handleError(error) };
  }
}

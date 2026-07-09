import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { generateWeeklyReport } from "@/actions/generate-weekly-report";
import { getLastWeekStart, shouldGenerateReport } from "@/lib/timezone-utils";

/**
 * Cron endpoint to generate weekly reports for all users
 * Should be called every Sunday at 9 AM UTC (configure via Vercel Cron or external service)
 * Each user's report will be generated at 9 AM in their own timezone
 *
 * Vercel Cron config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/weekly-reports",
 *     "schedule": "0 9 * * 0"
 *   }]
 * }
 *
 * Note: This cron runs at 9 AM UTC. For users in different timezones,
 * the report will be auto-generated when they visit the inbox after their local Sunday 9 AM.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a cron service (optional security check)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users (excluding guests)
    const users = await prisma.user.findMany({
      where: {
        isGuest: false,
      },
      select: {
        id: true,
        timezone: true,
      },
    });

    const results = [];
    const now = new Date();

    for (const user of users) {
      try {
        const userTimezone = user.timezone || "UTC";

        // Calculate last week's start (Sunday 9 AM in user's timezone)
        // We generate reports for the week that just ended
        const lastWeekStart = getLastWeekStart(now, userTimezone);

        // Check if report already exists for this week
        const existingReport = await prisma.weeklyReport.findUnique({
          where: {
            userId_weekStart: {
              userId: user.id,
              weekStart: lastWeekStart,
            },
          },
        });

        if (existingReport) {
          results.push({
            userId: user.id,
            status: "skipped",
            reason: "Report already exists",
          });
          continue;
        }

        // Check if it's time to generate (past Sunday 9 AM in user's timezone)
        const shouldGenerate = shouldGenerateReport(now, userTimezone, null);

        if (!shouldGenerate) {
          results.push({
            userId: user.id,
            status: "skipped",
            reason:
              "Not yet time to generate (before Sunday 9 AM in user's timezone)",
          });
          continue;
        }

        // Generate the report
        const result = await generateWeeklyReport(user.id, lastWeekStart);

        if (result.reportText) {
          results.push({
            userId: user.id,
            status: "success",
          });
        } else {
          results.push({
            userId: user.id,
            status: "failed",
            reason: result.errorMessage || "Unknown error",
          });
        }
      } catch (error) {
        console.error(`Error generating report for user ${user.id}:`, error);
        results.push({
          userId: user.id,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: users.length,
      results,
    });
  } catch (error) {
    console.error("Error in weekly reports cron:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Allow POST as well for manual triggers
export const POST = GET;

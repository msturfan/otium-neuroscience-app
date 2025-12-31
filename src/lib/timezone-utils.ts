/**
 * Utility functions for timezone-aware date operations
 */

/**
 * Get the start of the week (Sunday 09:00:00) in user's timezone
 * Reports are generated at 9 AM Sunday
 */
export function getWeekStart(date: Date, timezone: string): Date {
  // Create a date string in the user's timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const year = parseInt(parts.find((p) => p.type === "year")?.value || "0");
  const month = parseInt(parts.find((p) => p.type === "month")?.value || "0");
  const day = parseInt(parts.find((p) => p.type === "day")?.value || "0");
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0");
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0");
  const second = parseInt(parts.find((p) => p.type === "second")?.value || "0");

  const localDate = new Date(year, month - 1, day, hour, minute, second);

  // Get day of week (0 = Sunday, 6 = Saturday)
  const dayOfWeek = localDate.getDay();

  // Calculate days to subtract to get to Sunday
  const daysToSubtract = dayOfWeek;

  // Set to Sunday 09:00:00 (9 AM)
  localDate.setDate(localDate.getDate() - daysToSubtract);
  localDate.setHours(9, 0, 0, 0);

  return localDate;
}

/**
 * Get last week's start (Sunday 09:00:00) in user's timezone
 * This is the week that just ended (for which we generate the report)
 */
export function getLastWeekStart(date: Date, timezone: string): Date {
  const currentWeekStart = getWeekStart(date, timezone);
  const lastWeekStart = new Date(currentWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  return lastWeekStart;
}

/**
 * Check if a report should be generated for the last week
 * Returns true if it's past Sunday 9 AM and no report exists yet
 */
export function shouldGenerateReport(
  now: Date,
  timezone: string,
  lastReportWeekStart: Date | null,
): boolean {
  const lastWeekStart = getLastWeekStart(now, timezone);

  // If we already have a report for last week, don't generate
  if (
    lastReportWeekStart &&
    lastReportWeekStart.getTime() === lastWeekStart.getTime()
  ) {
    return false;
  }

  // Check if it's past Sunday 9 AM in user's timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find((p) => p.type === "year")?.value || "0");
  const month = parseInt(parts.find((p) => p.type === "month")?.value || "0");
  const day = parseInt(parts.find((p) => p.type === "day")?.value || "0");
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0");
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0");
  const second = parseInt(parts.find((p) => p.type === "second")?.value || "0");

  const localNow = new Date(year, month - 1, day, hour, minute, second);
  const dayOfWeek = localNow.getDay();
  const currentHour = localNow.getHours();

  // If it's Sunday and past 9 AM, or any day after Sunday, we should generate
  if (dayOfWeek === 0) {
    // Sunday - check if it's past 9 AM
    return currentHour >= 9;
  } else if (dayOfWeek > 0) {
    // Monday-Saturday - always generate if report is missing
    return true;
  }

  return false;
}

/**
 * Format note date for display
 */
export function formatNoteDate(date: Date, timezone: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: timezone,
  });
}

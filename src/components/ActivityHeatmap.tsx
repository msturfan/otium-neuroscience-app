"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { DailyNoteCount } from "@/actions/analytics";

interface ActivityHeatmapProps {
  data: DailyNoteCount[];
}

// GitHub-style intensity levels (0-4)
function getIntensityLevel(count: number, maxCount: number): number {
  if (count === 0) return 0;
  if (maxCount === 0) return 0;

  const ratio = count / maxCount;
  if (ratio >= 0.8) return 4;
  if (ratio >= 0.6) return 3;
  if (ratio >= 0.4) return 2;
  if (ratio >= 0.2) return 1;
  return 1;
}

// Generate all days for the current calendar year (Jan 1 to Dec 31)
function generateYearDays(): string[] {
  const days: string[] = [];
  const currentYear = new Date().getFullYear();

  // Start from January 1 of current year
  const startDate = new Date(currentYear, 0, 1); // January 1
  startDate.setHours(0, 0, 0, 0);

  // End on December 31 of current year
  const endDate = new Date(currentYear, 11, 31); // December 31
  endDate.setHours(0, 0, 0, 0);

  // Calculate number of days in the year (handles leap years)
  const daysInYear =
    Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

  for (let i = 0; i < daysInYear; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    days.push(dateKey);
  }

  return days;
}

// Get day of week (0 = Sunday, 6 = Saturday)
function getDayOfWeek(dateString: string): number {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getDay();
}

// Get week number (0-52) for a given date
function getWeekNumber(dateString: string, startDate: Date): number {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const diffTime = date.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const { heatmapData, maxCount, totalNotes } = useMemo(() => {
    // Create a map for quick lookup
    const dataMap = new Map<string, number>();
    data.forEach((item) => {
      dataMap.set(item.date, item.count);
    });

    // Generate all days
    const allDays = generateYearDays();
    const startDate = new Date(allDays[0]);
    startDate.setHours(0, 0, 0, 0);

    // Find max count for intensity scaling
    const counts = Array.from(dataMap.values());
    const maxCount = counts.length > 0 ? Math.max(...counts) : 0;

    // Calculate total notes
    const totalNotes = counts.reduce((sum, count) => sum + count, 0);

    // Organize by week and day
    const weeks: Map<
      number,
      Map<number, { date: string; count: number; intensity: number }>
    > = new Map();

    allDays.forEach((dateString) => {
      const count = dataMap.get(dateString) || 0;
      const intensity = getIntensityLevel(count, maxCount);
      const weekNum = getWeekNumber(dateString, startDate);
      const dayOfWeek = getDayOfWeek(dateString);

      if (!weeks.has(weekNum)) {
        weeks.set(weekNum, new Map());
      }
      weeks
        .get(weekNum)!
        .set(dayOfWeek, { date: dateString, count, intensity });
    });

    return { heatmapData: weeks, maxCount, totalNotes };
  }, [data]);

  // Calculate month header with colspan for each month
  const monthHeaders = useMemo(() => {
    const allDays = generateYearDays();
    const startDate = new Date(allDays[0]);
    startDate.setHours(0, 0, 0, 0);

    // Extract year from first day to make it work for any year
    const [year] = allDays[0].split("-").map(Number);

    // Map each week to its month
    const weekToMonth = new Map<number, number>();
    allDays.forEach((dateString) => {
      const [, month] = dateString.split("-").map(Number);
      const weekNum = getWeekNumber(dateString, startDate);
      if (!weekToMonth.has(weekNum)) {
        weekToMonth.set(weekNum, month);
      }
    });

    // Group weeks by month and calculate colspan
    const headers: { label: string; colspan: number; startWeek: number }[] = [];
    let currentMonth = -1;
    let monthStartWeek = 0;
    let weekCount = 0;

    for (let weekNum = 0; weekNum < 53; weekNum++) {
      const month = weekToMonth.get(weekNum) ?? 1;

      if (month !== currentMonth) {
        // If we had a previous month, add it to headers
        if (currentMonth !== -1 && weekCount > 0) {
          const date = new Date(year, currentMonth - 1, 1);
          const monthName = date.toLocaleDateString("en-US", {
            month: "short",
          });
          headers.push({
            label: monthName,
            colspan: weekCount,
            startWeek: monthStartWeek,
          });
        }

        // Start tracking new month
        currentMonth = month;
        monthStartWeek = weekNum;
        weekCount = 1;
      } else {
        weekCount++;
      }
    }

    // Add the last month
    if (currentMonth !== -1 && weekCount > 0) {
      const date = new Date(year, currentMonth - 1, 1);
      const monthName = date.toLocaleDateString("en-US", { month: "short" });
      headers.push({
        label: monthName,
        colspan: weekCount,
        startWeek: monthStartWeek,
      });
    }

    return headers;
  }, []);

  const formatDate = (dateString: string): string => {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getIntensityColor = (intensity: number, hasNotes: boolean): string => {
    if (intensity === 0 || !hasNotes) {
      // No notes: darker in light mode, white border in dark mode
      return "bg-muted/60 dark:bg-transparent border border-muted-foreground/40 dark:border-white/60";
    }

    // Has notes: gradient based on intensity
    // Light mode: darker = more notes (light gray → dark gray → black)
    // Dark mode: lighter = more notes (dark gray → light gray → white)
    const colors = [
      // Level 1
      "bg-gray-300 dark:bg-gray-700 border border-gray-300 dark:border-gray-700",
      // Level 2
      "bg-gray-500 dark:bg-gray-500 border border-gray-500 dark:border-gray-500",
      // Level 3
      "bg-gray-700 dark:bg-gray-300 border border-gray-700 dark:border-gray-300",
      // Level 4
      "bg-black dark:bg-white border border-black dark:border-white",
    ];

    const colorIndex = Math.min(intensity - 1, 3);
    return colors[colorIndex] || colors[0];
  };

  const weekNumbers = Array.from({ length: 53 }, (_, i) => i);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          <span className="font-medium">{totalNotes}</span> notes in{" "}
          {new Date().getFullYear()}
        </div>
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={cn(
                  "h-3 w-3 rounded-sm",
                  getIntensityColor(level, level > 0),
                )}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="scrollbar-hide -mx-1 overflow-x-auto overflow-y-visible px-1 pb-2">
        <div className="inline-flex min-w-max flex-col gap-1">
          {/* Month header row */}
          <div className="flex">
            <div className="w-[28px] flex-shrink-0" />{" "}
            {/* Spacer for day labels column */}
            <div className="flex gap-1">
              {monthHeaders.map((header, idx) => {
                // Calculate width: each week is 12px (w-3) + 4px gap (gap-1) = 16px
                // For N weeks spanning: (N * 12px) + ((N - 1) * 4px) = 16N - 4
                const width = header.colspan * 16 - 4;
                return (
                  <div
                    key={idx}
                    className="text-muted-foreground flex-shrink-0 text-xs"
                    style={{
                      width: `${width}px`,
                      minWidth: `${width}px`,
                    }}
                  >
                    {header.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main grid with day labels and heatmap */}
          <div className="inline-flex min-w-max gap-1">
            {/* Day labels */}
            <div className="text-muted-foreground flex flex-col gap-1 text-xs">
              {["", "Mon", "", "Wed", "", "Fri", ""].map((day, i) => (
                <div
                  key={i}
                  className="flex h-3 min-w-[28px] items-center justify-end pr-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="flex gap-1">
              {weekNumbers.map((weekNum) => {
                const weekData = heatmapData.get(weekNum);

                return (
                  <div key={weekNum} className="flex flex-col gap-1">
                    {/* Days of week */}
                    {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                      const dayData = weekData?.get(dayOfWeek);

                      // Always render a square, even if no data
                      if (!dayData) {
                        return (
                          <div
                            key={dayOfWeek}
                            className="bg-muted/60 border-muted-foreground/40 h-3 w-3 rounded-sm border dark:border-white/60 dark:bg-transparent"
                            title="No notes"
                          />
                        );
                      }

                      return (
                        <div
                          key={dayOfWeek}
                          className={cn(
                            "h-3 w-3 cursor-pointer rounded-sm transition-colors hover:opacity-80",
                            getIntensityColor(
                              dayData.intensity,
                              dayData.count > 0,
                            ),
                          )}
                          title={`${formatDate(dayData.date)}: ${dayData.count} note${dayData.count !== 1 ? "s" : ""}`}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

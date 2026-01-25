"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { fetchYearlyNoteActivity, type DailyNoteCount } from "@/actions/analytics";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnalyticsDialog({ open, onOpenChange }: AnalyticsDialogProps) {
  const [data, setData] = useState<DailyNoteCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchYearlyNoteActivity();
      if (result.errorMessage) {
        setError(result.errorMessage);
      } else {
        setData(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Yearly Activity</DialogTitle>
          <DialogDescription>
            Your note-taking activity in {new Date().getFullYear()}. Each square represents a day.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="space-y-4 py-4">
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-1">
              {Array.from({ length: 53 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <Skeleton className="h-3 w-3" />
                  {Array.from({ length: 7 }).map((_, j) => (
                    <Skeleton key={j} className="h-3 w-3" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="py-8 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="flex-1 overflow-visible min-h-0">
            <ActivityHeatmap data={data} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ChevronDown, ChevronUp, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import LLMResponse from "@/components/LLMResponse";
import { deleteWorkoutProgramAction } from "@/actions/workout-program";

export type SavedProgram = {
  id: string;
  title: string;
  startDate: Date | string;
  endDate: Date | string;
  content: string;
  createdAt: Date | string;
};

type Props = {
  programs: SavedProgram[];
};

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SavedWorkoutPrograms({ programs }: Props) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(
    programs[0]?.id ?? null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteWorkoutProgramAction(id);
    setDeletingId(null);
    router.refresh();
  };

  if (programs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center">
        <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">
          No program on file yet
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          You have not created or saved a workout program. Open the workout
          chat, then use &quot;Create Workout Program&quot; to generate a plan
          tailored to your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {programs.map((program) => {
        const isExpanded = expandedId === program.id;
        return (
          <div
            key={program.id}
            className="overflow-hidden rounded-lg border bg-card shadow-sm"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <h3 className="truncate text-sm font-semibold">
                  {program.title}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDate(program.startDate)} — {formatDate(program.endDate)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  disabled={deletingId === program.id}
                  aria-label="Delete program"
                  onClick={() => handleDelete(program.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground"
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                  onClick={() =>
                    setExpandedId(isExpanded ? null : program.id)
                  }
                >
                  {isExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Content */}
            {isExpanded && (
              <div className="border-t px-4 py-4">
                <LLMResponse content={program.content} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

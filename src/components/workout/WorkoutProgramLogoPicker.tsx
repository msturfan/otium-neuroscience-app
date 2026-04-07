"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  WORKOUT_PROGRAM_LOGOS,
  getWorkoutProgramLogoDefinition,
  type WorkoutProgramLogoId,
} from "@/lib/workout/workoutProgramLogos";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

type Props = {
  value: string;
  onChange: (id: WorkoutProgramLogoId) => void;
  className?: string;
};

export function WorkoutProgramLogoPicker({
  value,
  onChange,
  className,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const current = getWorkoutProgramLogoDefinition(value);
  const CurrentIcon = current.Icon;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("mb-2 h-12 w-12 rounded-full", className)}
          aria-label="Change program profile logo"
        >
          <CurrentIcon className="text-foreground size-8" stroke="2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-[280px] p-3">
        <div className="grid grid-cols-5 gap-2">
          {WORKOUT_PROGRAM_LOGOS.map(({ id, label, Icon }) => {
            const active = id === current.id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onChange(id);
                  setOpen(false);
                }}
                className={cn(
                  "hover:bg-accent hover:text-accent-foreground flex items-center justify-center rounded-md border p-2 transition-colors",
                  active ? "border-primary bg-primary/10" : "border-border",
                )}
                aria-pressed={active}
                aria-label={label}
              >
                <Icon className="size-6" stroke="2" />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}


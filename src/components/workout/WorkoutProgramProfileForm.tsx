"use client";

import {
  useState,
  useTransition,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { toast } from "sonner";
import { Dumbbell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

import { saveWorkoutProfileAction } from "@/actions/workout-profile";
import { workoutProgramProfileSchema } from "@/lib/validation/workoutProgramProfileSchema";
import {
  DEFAULT_WORKOUT_PROFILE,
  TRAINING_LEVELS,
  GYM_DAYS_OPTIONS,
  TIMELINE_OPTIONS,
  type WorkoutProgramProfile,
} from "@/lib/types/workout";
import { useWorkoutProfileEditor } from "@/providers/WorkoutProfileEditorProvider";

type Props = {
  onComplete: () => void;
  onCancel?: () => void;
  mode: "create" | "edit";
  initialData: WorkoutProgramProfile;
};

type FieldErrors = Partial<Record<keyof WorkoutProgramProfile, string>>;

export default function WorkoutProgramProfileForm({
  onComplete,
  onCancel,
  mode,
  initialData,
}: Props) {
  const baselineRef = useRef<WorkoutProgramProfile>(initialData);
  const [formData, setFormData] = useState<WorkoutProgramProfile>(initialData);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();
  const { setWorkoutProfileFormOpen } = useWorkoutProfileEditor();

  useEffect(() => {
    setWorkoutProfileFormOpen(true);
    return () => setWorkoutProfileFormOpen(false);
  }, [setWorkoutProfileFormOpen]);

  useEffect(() => {
    baselineRef.current = { ...initialData };
    setFormData({ ...initialData });
    setErrors({});
  }, [initialData]);

  const updateField = <K extends keyof WorkoutProgramProfile>(
    field: K,
    value: WorkoutProgramProfile[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const runSave = useCallback(() => {
    const parsed = workoutProgramProfileSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof WorkoutProgramProfile;
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    startTransition(async () => {
      const result = await saveWorkoutProfileAction(parsed.data);
      if (result.errorMessage) {
        toast.error(result.errorMessage);
      } else {
        toast.success(
          mode === "edit"
            ? "Workout profile updated."
            : "Profile saved! Let's start training.",
        );
        baselineRef.current = { ...parsed.data };
        onComplete();
      }
    });
  }, [formData, mode, onComplete]);

  const runCancel = useCallback(() => {
    if (mode === "edit") {
      setFormData({ ...baselineRef.current });
      setErrors({});
      onCancel?.();
    } else {
      setFormData({ ...DEFAULT_WORKOUT_PROFILE });
      setErrors({});
    }
  }, [mode, onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSave();
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <Dumbbell className="mb-2 h-8 w-8 text-foreground" />
        <h1 className="text-xl font-semibold tracking-tight">
          {mode === "edit"
            ? "Edit your workout program"
            : "Build your workout program"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "edit"
            ? "Update your details anytime. Use Save when you are done or Cancel to discard changes."
            : "Tell us a few details so we can personalize your training plan. Save when you are ready, or Cancel to clear the form."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-5">
        {/* Goal */}
        <div className="space-y-1.5">
          <Label htmlFor="goal">
            Goal <span className="text-destructive">*</span>
          </Label>
          <Input
            id="goal"
            value={formData.goal}
            onChange={(e) => updateField("goal", e.target.value)}
            placeholder="Build muscle, lose fat, improve strength..."
            aria-invalid={!!errors.goal}
            aria-describedby={errors.goal ? "goal-error" : "goal-hint"}
          />
          {errors.goal ? (
            <p id="goal-error" className="text-xs text-destructive">
              {errors.goal}
            </p>
          ) : (
            <p id="goal-hint" className="text-xs text-muted-foreground">
              What is your main training goal?
            </p>
          )}
        </div>

        {/* Training History Level */}
        <div className="space-y-1.5">
          <Label htmlFor="trainingHistoryLevel">
            Training history level <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2">
            {TRAINING_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() =>
                  updateField("trainingHistoryLevel", level.value)
                }
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  formData.trainingHistoryLevel === level.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
          {errors.trainingHistoryLevel ? (
            <p className="text-xs text-destructive">
              {errors.trainingHistoryLevel}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Choose the level that best matches your recent training experience.
            </p>
          )}
        </div>

        {/* Gym Days Per Week & Timeline - side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="gymDaysPerWeek">
              Gym days per week <span className="text-destructive">*</span>
            </Label>
            <Select
              value={String(formData.gymDaysPerWeek)}
              onValueChange={(val) =>
                updateField("gymDaysPerWeek", Number(val))
              }
            >
              <SelectTrigger id="gymDaysPerWeek" className="w-full">
                <SelectValue placeholder="Select days" />
              </SelectTrigger>
              <SelectContent>
                {GYM_DAYS_OPTIONS.map((day) => (
                  <SelectItem key={day} value={String(day)}>
                    {day} {day === 1 ? "day" : "days"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.gymDaysPerWeek ? (
              <p className="text-xs text-destructive">
                {errors.gymDaysPerWeek}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                How many days can you train?
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="timelineWeeks">
              Timeline <span className="text-destructive">*</span>
            </Label>
            <Select
              value={String(formData.timelineWeeks)}
              onValueChange={(val) =>
                updateField("timelineWeeks", Number(val))
              }
            >
              <SelectTrigger id="timelineWeeks" className="w-full">
                <SelectValue placeholder="Select timeline" />
              </SelectTrigger>
              <SelectContent>
                {TIMELINE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.timelineWeeks ? (
              <p className="text-xs text-destructive">
                {errors.timelineWeeks}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                How long should this program focus on?
              </p>
            )}
          </div>
        </div>

        {/* Lifestyle Constraints */}
        <div className="space-y-1.5">
          <Label htmlFor="lifestyleConstraints">Lifestyle constraints</Label>
          <Textarea
            id="lifestyleConstraints"
            value={formData.lifestyleConstraints}
            onChange={(e) =>
              updateField("lifestyleConstraints", e.target.value)
            }
            placeholder="Limited time, travel, injuries, recovery issues, equipment limits..."
            aria-invalid={!!errors.lifestyleConstraints}
            rows={2}
          />
          {errors.lifestyleConstraints ? (
            <p className="text-xs text-destructive">
              {errors.lifestyleConstraints}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Add schedule limits, injuries, recovery issues, or equipment
              access.
            </p>
          )}
        </div>

        {/* Nutrition Baseline */}
        <div className="space-y-1.5">
          <Label htmlFor="nutritionBaseline">Nutrition baseline</Label>
          <Textarea
            id="nutritionBaseline"
            value={formData.nutritionBaseline}
            onChange={(e) => updateField("nutritionBaseline", e.target.value)}
            placeholder="High protein, inconsistent calories, skips breakfast, mostly takeout..."
            aria-invalid={!!errors.nutritionBaseline}
            rows={2}
          />
          {errors.nutritionBaseline ? (
            <p className="text-xs text-destructive">
              {errors.nutritionBaseline}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Describe how you currently eat.
            </p>
          )}
        </div>

        <div className="flex w-full flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full sm:w-auto sm:min-w-[7.5rem]"
            disabled={isPending}
            onClick={runCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-auto sm:min-w-[7.5rem]"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Spinner className="mr-2" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export type TrainingHistoryLevel = "beginner" | "intermediate" | "advanced";

export type WorkoutProgramProfile = {
  goal: string;
  lifestyleConstraints: string;
  nutritionBaseline: string;
  trainingHistoryLevel: TrainingHistoryLevel;
  gymDaysPerWeek: number;
  timelineWeeks: number;
};

export const TRAINING_LEVELS: { value: TrainingHistoryLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export const GYM_DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7] as const;

export const TIMELINE_OPTIONS: { value: number; label: string }[] = [
  { value: 4, label: "4 weeks" },
  { value: 6, label: "6 weeks" },
  { value: 8, label: "8 weeks" },
  { value: 12, label: "12 weeks" },
  { value: 16, label: "16 weeks" },
];

export const DEFAULT_WORKOUT_PROFILE: WorkoutProgramProfile = {
  goal: "",
  lifestyleConstraints: "",
  nutritionBaseline: "",
  trainingHistoryLevel: "beginner",
  gymDaysPerWeek: 3,
  timelineWeeks: 8,
};

const TRAINING_LEVEL_VALUES = new Set<string>(
  TRAINING_LEVELS.map((l) => l.value),
);

function isTrainingHistoryLevel(value: string): value is TrainingHistoryLevel {
  return TRAINING_LEVEL_VALUES.has(value);
}

/** Coerce DB string to a known level; invalid or legacy values fall back safely. */
export function trainingHistoryLevelFromDb(raw: string): TrainingHistoryLevel {
  return isTrainingHistoryLevel(raw)
    ? raw
    : DEFAULT_WORKOUT_PROFILE.trainingHistoryLevel;
}

/** Map persisted workout profile fields to the program form shape */
export function workoutProgramProfileFromDb(row: {
  goal: string;
  lifestyleConstraints: string | null;
  nutritionBaseline: string | null;
  trainingHistoryLevel: string;
  gymDaysPerWeek: number;
  timelineWeeks: number;
}): WorkoutProgramProfile {
  return {
    goal: row.goal,
    lifestyleConstraints: row.lifestyleConstraints ?? "",
    nutritionBaseline: row.nutritionBaseline ?? "",
    trainingHistoryLevel: trainingHistoryLevelFromDb(row.trainingHistoryLevel),
    gymDaysPerWeek: row.gymDaysPerWeek,
    timelineWeeks: row.timelineWeeks,
  };
}

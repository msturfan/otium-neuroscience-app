import { z } from "zod";

export const workoutProgramProfileSchema = z.object({
  goal: z
    .string()
    .min(2, "Goal must be at least 2 characters")
    .max(200, "Goal must be 200 characters or fewer"),
  lifestyleConstraints: z
    .string()
    .max(500, "Must be 500 characters or fewer")
    .optional()
    .default(""),
  nutritionBaseline: z
    .string()
    .max(500, "Must be 500 characters or fewer")
    .optional()
    .default(""),
  trainingHistoryLevel: z.enum(["beginner", "intermediate", "advanced"], {
    message: "Please select your training level",
  }),
  gymDaysPerWeek: z
    .number({ message: "Please select gym days per week" })
    .int()
    .min(1, "Must be at least 1 day")
    .max(7, "Cannot exceed 7 days"),
  timelineWeeks: z
    .number({ message: "Please select a timeline" })
    .int()
    .min(4, "Minimum 4 weeks")
    .max(16, "Maximum 16 weeks"),
});

export type WorkoutProgramProfileFormData = z.infer<typeof workoutProgramProfileSchema>;

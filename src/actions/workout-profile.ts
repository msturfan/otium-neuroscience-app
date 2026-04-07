"use server";

import { getUser } from "@/auth/server";
import { prisma } from "@/db/prisma";
import { handleError } from "@/lib/utils";
import { workoutProgramProfileSchema } from "@/lib/validation/workoutProgramProfileSchema";
import {
  workoutProgramProfileFromDb,
  type WorkoutProgramProfile,
} from "@/lib/types/workout";

export async function saveWorkoutProfileAction(data: WorkoutProgramProfile) {
  const user = await getUser();
  if (!user) return { errorMessage: "Not signed in" };

  const parsed = workoutProgramProfileSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid form data";
    return { errorMessage: firstError };
  }

  try {
    await prisma.workoutProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        goal: parsed.data.goal,
        lifestyleConstraints: parsed.data.lifestyleConstraints ?? "",
        nutritionBaseline: parsed.data.nutritionBaseline ?? "",
        trainingHistoryLevel: parsed.data.trainingHistoryLevel,
        gymDaysPerWeek: parsed.data.gymDaysPerWeek,
        timelineWeeks: parsed.data.timelineWeeks,
      },
      update: {
        goal: parsed.data.goal,
        lifestyleConstraints: parsed.data.lifestyleConstraints ?? "",
        nutritionBaseline: parsed.data.nutritionBaseline ?? "",
        trainingHistoryLevel: parsed.data.trainingHistoryLevel,
        gymDaysPerWeek: parsed.data.gymDaysPerWeek,
        timelineWeeks: parsed.data.timelineWeeks,
      },
    });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
}

export async function fetchWorkoutProfileAction() {
  const user = await getUser();
  if (!user) return { profile: null, errorMessage: "Not signed in" };

  try {
    const row = await prisma.workoutProfile.findUnique({
      where: { userId: user.id },
    });

    const profile = row ? workoutProgramProfileFromDb(row) : null;

    return { profile, errorMessage: null };
  } catch (error) {
    return { profile: null, ...handleError(error) };
  }
}

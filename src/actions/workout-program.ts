"use server";

import { getUser } from "@/auth/server";
import { prisma } from "@/db/prisma";
import { handleError } from "@/lib/utils";

export async function saveWorkoutProgramAction(data: {
  title: string;
  content: string;
  startDate: string;
  endDate: string;
}) {
  const user = await getUser();
  if (!user) return { id: null, errorMessage: "Not signed in" };

  try {
    const program = await prisma.workoutProgram.create({
      data: {
        userId: user.id,
        title: data.title,
        content: data.content,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    });
    return { id: program.id, errorMessage: null };
  } catch (error) {
    return { id: null, ...handleError(error) };
  }
}

export async function fetchWorkoutProgramsAction() {
  const user = await getUser();
  if (!user) return { programs: [], errorMessage: "Not signed in" };

  try {
    const programs = await prisma.workoutProgram.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        content: true,
        createdAt: true,
      },
    });
    return { programs, errorMessage: null };
  } catch (error) {
    return { programs: [], ...handleError(error) };
  }
}

export async function deleteWorkoutProgramAction(id: string) {
  const user = await getUser();
  if (!user) return { errorMessage: "Not signed in" };

  try {
    await prisma.workoutProgram.delete({
      where: { id, userId: user.id },
    });
    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
}

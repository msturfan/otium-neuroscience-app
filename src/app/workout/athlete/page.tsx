import { redirect } from "next/navigation";
import { prisma } from "@/db/prisma";
import { getUser } from "@/auth/server";
import {
  workoutProgramProfileFromDb,
  DEFAULT_WORKOUT_PROFILE,
} from "@/lib/types/workout";
import AthleteProfileClient from "./AthleteProfileClient";

export default async function AthleteProfilePage() {
  const user = await getUser();

  if (!user) {
    redirect("/sign-up");
  }

  const profileRow = await prisma.workoutProfile.findUnique({
    where: { userId: user.id },
  });

  const initialProfile = profileRow
    ? workoutProgramProfileFromDb(profileRow)
    : DEFAULT_WORKOUT_PROFILE;

  const mode = profileRow ? "edit" : "create";

  return <AthleteProfileClient initialProfile={initialProfile} mode={mode} />;
}

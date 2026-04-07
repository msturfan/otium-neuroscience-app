import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/db/prisma";
import { getUser } from "@/auth/server";
import { workoutProgramProfileFromDb } from "@/lib/types/workout";
import { TRAINING_LEVELS, TIMELINE_OPTIONS } from "@/lib/types/workout";
import { Button } from "@/components/ui/button";

export default async function WorkoutProgramPage() {
  const user = await getUser();

  if (!user) {
    redirect("/sign-up");
  }

  const profileRow = await prisma.workoutProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profileRow) {
    redirect("/workout/athlete");
  }

  const profile = workoutProgramProfileFromDb(profileRow);

  const trainingLevelLabel =
    TRAINING_LEVELS.find((l) => l.value === profile.trainingHistoryLevel)
      ?.label ?? profile.trainingHistoryLevel;

  const timelineLabel =
    TIMELINE_OPTIONS.find((o) => o.value === profile.timelineWeeks)?.label ??
    `${profile.timelineWeeks} weeks`;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 py-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Workout Program
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your current training profile and program parameters.
        </p>
      </div>

      <div className="divide-y divide-border rounded-lg border">
        <ProfileRow label="Goal" value={profile.goal} />
        <ProfileRow label="Training level" value={trainingLevelLabel} />
        <ProfileRow
          label="Gym days per week"
          value={`${profile.gymDaysPerWeek} ${profile.gymDaysPerWeek === 1 ? "day" : "days"}`}
        />
        <ProfileRow label="Program timeline" value={timelineLabel} />
        {profile.lifestyleConstraints && (
          <ProfileRow
            label="Lifestyle constraints"
            value={profile.lifestyleConstraints}
          />
        )}
        {profile.nutritionBaseline && (
          <ProfileRow
            label="Nutrition baseline"
            value={profile.nutritionBaseline}
          />
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="sm:flex-1">
          <Link href="/workout">Start a workout chat</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="sm:flex-1">
          <Link href="/workout/athlete">Edit athlete profile</Link>
        </Button>
      </div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:gap-4">
      <span className="w-44 shrink-0 text-sm font-medium text-muted-foreground">
        {label}
      </span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

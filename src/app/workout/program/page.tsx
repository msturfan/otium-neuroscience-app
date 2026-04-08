import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/db/prisma";
import { getUser } from "@/auth/server";
import { Button } from "@/components/ui/button";
import SavedWorkoutPrograms from "@/components/workout/SavedWorkoutPrograms";

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

  const savedPrograms = await prisma.workoutProgram.findMany({
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

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 py-4">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Workout Program
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your saved training programs and continue planning in chat.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="sm:flex-1">
          <Link href="/workout">Start a workout chat</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="sm:flex-1">
          <Link href="/workout/athlete">Edit athlete profile</Link>
        </Button>
      </div>

      {/* Saved programs */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Saved Programs ({savedPrograms.length})
        </h2>
        <SavedWorkoutPrograms
          programs={savedPrograms.map((p) => ({
            ...p,
            startDate: p.startDate.toISOString(),
            endDate: p.endDate.toISOString(),
            createdAt: p.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}

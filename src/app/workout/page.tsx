import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { prisma } from "@/db/prisma";
import { getUser } from "@/auth/server";
import HomeToaster from "@/components/HomeToaster";
import WorkoutTextInput from "@/components/WorkoutTextInput";
import { getWorkoutGreeting } from "@/lib/workout-greetings-server";
import { getTimeBasedGreeting } from "@/lib/get-time-based-greeting";
import { getUserProfile } from "@/lib/user-utils";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WorkoutPage({ searchParams }: Props) {
  const user = await getUser();

  if (!user) {
    redirect("/sign-up");
  }

  const greeting = getWorkoutGreeting();
  const timeBasedGreeting = getTimeBasedGreeting();
  const userProfile = await getUserProfile(user);
  const userName = userProfile?.name
    ? userProfile.name.split(" ")[0]
    : user?.email?.split("@")[0] || "Guest";

  const sp = (await searchParams) ?? {};
  const noteIdParam = sp.noteId;
  const noteId = Array.isArray(noteIdParam)
    ? noteIdParam[0]
    : noteIdParam || "";

  if (!noteId) {
    const newId = randomUUID();
    redirect(`/workout?noteId=${newId}`);
  }

  let note: { text: string } | null = null;
  note = await prisma.workout.findFirst({
    where: { id: noteId, authorId: user.id },
    select: { text: true },
  });

  const feedNotes = await prisma.workout.findMany({
    where: { authorId: user.id, id: noteId },
    orderBy: { createdAt: "asc" },
    take: 1,
    select: { id: true, text: true, createdAt: true },
  });

  const hasContentServer = !!feedNotes[0]?.text?.trim();

  return (
    <div
      id="shell"
      className={`flex h-full min-h-0 flex-col items-center ${
        hasContentServer ? "justify-start" : "justify-center"
      } gap-4 px-4`}
    >
      <div className="relative w-full max-w-4xl flex-1 min-h-0">
        <div className="flex h-full min-h-0 justify-center">
          <WorkoutTextInput
            noteId={noteId}
            startingNoteText={note?.text || ""}
            user={user}
            feedNotes={feedNotes}
            greeting={greeting}
            welcomeMessage={`${timeBasedGreeting}, ${userName}!`}
          />
        </div>
        <HomeToaster />
      </div>
    </div>
  );
}

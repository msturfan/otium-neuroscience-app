import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { prisma } from "@/db/prisma";
import { getUser } from "@/auth/server";
import HomeToaster from "@/components/HomeToaster";
import NeuroscienceTextInput from "@/components/NeuroscienceTextInput";
import { getNeuroscienceGreeting } from "@/lib/neuroscience-greetings-server";
import { getTimeBasedGreeting } from "@/lib/get-time-based-greeting";
import { getUserProfile } from "@/lib/user-utils";
import { Brain } from "lucide-react";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NeuroplasticityPage({ searchParams }: Props) {
  const user = await getUser();
  
  // Redirect guest users to signup page
  if (!user) {
    redirect("/sign-up");
  }
  
  const greeting = getNeuroscienceGreeting();
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
    redirect(`/neuroplasticity?noteId=${newId}`);
  }

  let note: { text: string } | null = null;
  if (user) {
    note = await prisma.neuroscience.findFirst({
      where: { id: noteId, authorId: user.id },
      select: { text: true },
    });
  }

  const feedNotes = user
    ? await prisma.neuroscience.findMany({
        where: { authorId: user.id, id: noteId },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { id: true, text: true, createdAt: true },
      })
    : [];

  const hasContentServer = !!feedNotes[0]?.text?.trim();

  return (
    <div
      id="shell"
      className={`flex h-full flex-col items-center ${
        hasContentServer ? "justify-start" : "justify-center"
      } gap-4 px-4`}
    >
      {!hasContentServer && (
        <div className="flex flex-col items-center mb-2">
          <div className="flex flex-col items-center gap-2 mb-4">
            {/* Brain Icon */}
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-gray-800 dark:text-gray-200" />
            </div>
            {/* Time-based Greeting with User Name */}
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <span>{timeBasedGreeting}, {userName}!</span>
            </div>
          </div>
        </div>
      )}
      <div className="relative w-full max-w-4xl flex-1">
        <div className="flex h-full justify-center">
          <NeuroscienceTextInput
            noteId={noteId}
            startingNoteText={note?.text || ""}
            user={user}
            feedNotes={feedNotes}
            greeting={greeting}
          />
        </div>
        <HomeToaster />
      </div>
    </div>
  );
}

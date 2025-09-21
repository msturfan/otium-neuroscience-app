import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { prisma } from "@/db/prisma";
import { getUser } from "@/auth/server";
import HomeToaster from "@/components/HomeToaster";
import NoteTextInput from "@/components/NoteTextInput";
import { getServerSideGreeting } from "@/lib/greetings-server";

type Props = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function HomePage({ searchParams }: Props) {
  const user = await getUser();
  const greeting = getServerSideGreeting();

  const noteIdParam = searchParams?.noteId;
  const noteId = Array.isArray(noteIdParam)
    ? noteIdParam[0]
    : noteIdParam || "";

  // Always have a canonical noteId in the URL
  if (!noteId) {
    const newId = randomUUID();
    redirect(`/?noteId=${newId}`);
  }

  // Load current note text if signed in
  let note: { text: string } | null = null;
  if (user) {
    note = await prisma.note.findFirst({
      where: { id: noteId, authorId: user.id },
      select: { text: true },
    });
  }

  // Feed for THIS note only (0..1 items)
  const feedNotes = user
    ? await prisma.note.findMany({
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
      <div id="hero-block" className={hasContentServer ? "hidden" : ""}>
        <div className="flex flex-col items-center">
          <img
            src="/appicon1.ico"
            alt="App Logo"
            className="mb-0.5 h-20 dark:hidden"
          />
          <img
            src="/appicon1.ico"
            alt="App Logo"
            className="mb-0.5 hidden h-20 dark:block"
          />
          <h1 className="text-center text-3xl font-bold text-gray-800 dark:text-gray-200">
            {greeting}
          </h1>
        </div>
      </div>

      <div className="relative w-full max-w-4xl">
        <div className="flex justify-center">
          <NoteTextInput
            noteId={noteId}
            startingNoteText={note?.text || ""}
            user={user}
            feedNotes={feedNotes} // only this note (0..1)
          />
        </div>
        <HomeToaster />
      </div>
    </div>
  );
}

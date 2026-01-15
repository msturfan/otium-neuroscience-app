import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import Image from "next/image";
import { prisma } from "@/db/prisma";
import { getUser } from "@/auth/server";
import HomeToaster from "@/components/HomeToaster";
import NoteTextInput from "@/components/NoteTextInput";
import { getServerSideGreeting } from "@/lib/greetings-server";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: Props) {
  const user = await getUser();
  const greeting = getServerSideGreeting();

  const sp = (await searchParams) ?? {};
  const noteIdParam = sp.noteId;
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
      {!hasContentServer && (
        <div className="flex flex-col items-center mb-2">
          <Image
            src="/otium_gray.ico"
            alt="Otium Logo"
            width={150}
            height={150}
            className="mx-auto opacity-30"
          />
        </div>
      )}
      <div className="relative w-full max-w-4xl">
        <div className="flex justify-center">
          <NoteTextInput
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

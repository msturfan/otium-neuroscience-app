import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { prisma } from "@/db/prisma";
import { getUser } from "@/auth/server";
import HomeToaster from "@/components/HomeToaster";
import NoteTextInput from "@/components/NoteTextInput";
import { getServerSideGreeting } from "@/lib/greetings-server";

type PersistedChatMessage = {
  id: string;
  text: string;
  createdAt: string;
  isAI?: boolean;
};

function parsePersistedMessages(raw: unknown): PersistedChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const parsed: PersistedChatMessage[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const candidate = entry as Record<string, unknown>;
    if (typeof candidate.id !== "string" || typeof candidate.text !== "string") continue;
    if (typeof candidate.createdAt !== "string") continue;
    parsed.push({
      id: candidate.id,
      text: candidate.text,
      createdAt: candidate.createdAt,
      isAI: candidate.isAI === true,
    });
  }
  return parsed;
}

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
  let note: { text: string; chatMessages: unknown } | null = null;
  if (user) {
    note = await prisma.note.findFirst({
      where: { id: noteId, authorId: user.id },
      select: { text: true, chatMessages: true },
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
      className={`flex h-full min-h-0 flex-col items-center ${
        hasContentServer ? "justify-start" : "justify-center"
      } gap-4 px-4`}
    >
      <div className="relative w-full max-w-4xl flex-1 min-h-0">
        <div className="flex h-full min-h-0 justify-center">
          <NoteTextInput
            noteId={noteId}
            startingNoteText={note?.text || ""}
            startingChatMessages={parsePersistedMessages(note?.chatMessages)}
            user={user}
            feedNotes={feedNotes}
            greeting={greeting}
            showOtiumLogo
          />
        </div>
        <HomeToaster />
      </div>
    </div>
  );
}

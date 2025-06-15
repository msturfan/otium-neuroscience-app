import { getUser } from "@/auth/server";
import AskAIButton from "@/components/AskAIButton";
import HomeToaster from "@/components/HomeToaster";
import NewNoteButton from "@/components/NewNoteButton";
import NoteTextInput from "@/components/NoteTextInput";
import { prisma } from "@/db/prisma";

type Props = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

async function HomePage({ searchParams }: Props) {
  const noteIdParam = (await searchParams).notId;
  const user = await getUser();

  const noteId = Array.isArray(noteIdParam)
    ? noteIdParam![0]
    : noteIdParam || "";

  const note = await prisma.note.findUnique({
    where: { id: noteId, authorId: user?.id },
  });

  return (
    <div className="flex h-full flex-col items-center justify-center gap-16 px-4">
      <h1 className="text-center text-3xl font-bold text-gray-800 dark:text-gray-200">
        What can I help with?
      </h1>

      <div className="relative w-full max-w-4xl">
        <div className="absolute -top-12 right-0 z-10 flex gap-2">
        </div>

        <div className="flex justify-center">
          <NoteTextInput
            noteId={noteId}
            startingNoteText={note?.text || ""}
            user={user}
          />
        </div>
        <HomeToaster />
      </div>
    </div>
  );
}

export default HomePage;

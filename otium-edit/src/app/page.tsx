import { getUser } from "@/auth/server";
import HomeToaster from "@/components/HomeToaster";
import NoteTextInput from "@/components/NoteTextInput";
import { prisma } from "@/db/prisma";

type Props = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

async function HomePage({ searchParams }: Props) {
  const noteIdParam = (await searchParams).noteId;
  const user = await getUser();

  const noteId = Array.isArray(noteIdParam)
    ? noteIdParam![0]
    : noteIdParam || "";

  let note = null;

  // Only fetch from database if user is authenticated
  if (user && noteId) {
    note = await prisma.note.findUnique({
      where: { id: noteId, authorId: user.id },
    });
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-4">
      <img 
        src="/appicon1.ico" 
        alt="App Logo" 
        className="mb-0.5 h-20 dark:hidden" 
      />
      <img 
        src="/appicon1.ico" 
        alt="App Logo" 
        className="mb-0.5 h-20 hidden dark:block" 
      />

      <h1 className="text-center text-3xl font-bold text-gray-800 dark:text-gray-200">
        What can I help with?
      </h1>

      <div className="relative w-full max-w-4xl">
        <div className="absolute -top-12 right-0 z-10 flex gap-2"></div>

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

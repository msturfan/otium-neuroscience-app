import { getUser } from "@/auth/server";
import AskAIButton from "@/components/AskAIButton";
import NewNoteButton from "@/components/NewNoteButton";
import NoteTextInput from "@/components/NoteTextInput";
import { prisma } from "@/db/prisma";

type Props = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

async function HomePage({ searchParams }: Props) {
  const notIdParam = (await searchParams).notId;
  const user = await getUser();

  const noteId = Array.isArray(notIdParam) ? notIdParam![0] : notIdParam || "";

  const note = await prisma.note.findUnique({
    where: { id: noteId, authorId: user?.id },
  });

  return (
    <div className="flex h-full flex-col items-center justify-center gap-16 px-4">
     
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 text-center">
        What can I help with?
      </h1>
      
      <div className="relative w-full max-w-4xl">
        <div className="absolute -top-12 right-0 flex gap-2 z-10">
          <AskAIButton user={user} />
          <NewNoteButton user={user} />
        </div>
        
        <div className="flex justify-center">
          <NoteTextInput 
            noteId={noteId} 
            startingNoteText={note?.text || ""}
          />
        </div>
      </div>
    </div>
  );
}

export default HomePage;

"use client";

import { useSearchParams } from "next/navigation";
import { ChangeEvent, useEffect, useRef } from "react";
import useNote from "@/hooks/useNote";
import { updateNoteAction, createNoteAction } from "@/actions/notes";
import NewNoteButton from "./NewNoteButton";
import { User } from "@supabase/supabase-js";
import { Textarea } from "./ui/textarea";
import AskAIButton from "./AskAIButton";

type Props = {
  noteId: string;
  startingNoteText: string;
  user: User | null;
};

let updateTimeout: NodeJS.Timeout;

function NoteTextInput({ noteId, startingNoteText, user }: Props) {
  const noteIdParam = useSearchParams().get("noteId") || "";
  const { noteText, setNoteText } = useNote();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (noteIdParam === noteId) {
      setNoteText(startingNoteText);
    } else {
      setNoteText("");
    }
  }, [startingNoteText, noteIdParam, noteId, setNoteText]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px"; // Reset first
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [noteText]);

  const handleUpdateNote = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNoteText(text);

    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      updateNoteAction(noteId, text);
    }, 1500);
  };

  return (
    <div className="relative flex w-full items-end px-3.5 py-2.5">
      <div className="relative flex w-full max-w-4xl flex-col rounded-2xl border bg-white shadow dark:bg-gray-900">
        <div>
          <Textarea
            ref={textareaRef}
            value={noteText}
            onChange={handleUpdateNote}
            placeholder="Type your notes here.."
            className="custom-scrollbar flex-1 resize-none rounded-t-2xl rounded-b-none border-0 bg-transparent p-4 shadow-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
            rows={1}
            style={{
              overflowY: "auto",
              minHeight: 48,
              maxHeight: 220,
            }}
          />
        </div>
        <div className="flex items-center justify-between rounded-b-2xl bg-transparent px-4 py-3">
          <div className="flex items-center gap-2"></div>

          <div className="flex items-center gap-2">
            <AskAIButton user={user} />
            <NewNoteButton user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default NoteTextInput;

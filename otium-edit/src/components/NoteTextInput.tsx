"use client";

import { useSearchParams } from "next/navigation";
import { ChangeEvent, useEffect, useRef } from "react";
import useNote from "@/hooks/useNote";
import { updateNoteAction, createNoteAction } from "@/actions/notes";
import NewNoteButton from "./NewNoteButton";
import { User } from "@supabase/supabase-js";
import { Textarea } from "./ui/textarea";
import AskAIButton from "./AskAIButton";
import MicrophoneButton from "./MicrophoneButton";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { GuestNote } from "@/providers/NoteProvider";

type Props = {
  noteId: string;
  startingNoteText: string;
  user: User | null;
};

let updateTimeout: NodeJS.Timeout;

function NoteTextInput({ noteId, startingNoteText, user }: Props) {
  const noteIdParam = useSearchParams().get("noteId") || "";
  const { noteText, setNoteText, guestNotes, updateGuestNote, addGuestNote } =
    useNote();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (noteIdParam === noteId) {
      // Check if it's a guest note
      const guestNote = guestNotes.find((note) => note.id === noteId);
      if (guestNote) {
        setNoteText(guestNote.text);
      } else {
        setNoteText(startingNoteText);
      }
    } else {
      setNoteText("");
    }
  }, [startingNoteText, noteIdParam, noteId, setNoteText, guestNotes]);

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
      // Check if it's a guest note
      const isGuestNote = guestNotes.some((note) => note.id === noteId);

      if (isGuestNote) {
        // Update guest note in local state
        updateGuestNote(noteId, text);
      } else if (user) {
        // Update authenticated user note in database
        updateNoteAction(noteId, text);
      }
    }, 1500);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Check if Enter is pressed (with cross-browser compatibility)
    if (e.key === "Enter" || e.keyCode === 13) {
      // If Shift is held, allow default behavior (new line)
      if (e.shiftKey) {
        return; // Let the default behavior happen
      }

      // Otherwise, prevent default and send the note
      e.preventDefault();
      e.stopPropagation();

      // Only proceed if there's some text
      if (noteText.trim()) {
        // Save current note immediately
        clearTimeout(updateTimeout);
        const isGuestNote = guestNotes.some((note) => note.id === noteId);

        if (isGuestNote) {
          updateGuestNote(noteId, noteText);
        } else if (user) {
          await updateNoteAction(noteId, noteText);
        }

        // Create new note
        const uuid = uuidv4();

        if (!user) {
          // Create guest note
          const guestNote: GuestNote = {
            id: uuid,
            text: "",
            createdAt: new Date(),
          };
          addGuestNote(guestNote);
          router.push(`/?noteId=${uuid}`);

          // Show notification for guest users
          toast.info("Please log in or sign up to save your notes", {
            duration: 5000,
            action: {
              label: "Log in",
              onClick: () => router.push("/login"),
            },
          });
        } else {
          // Create authenticated user note
          const result = await createNoteAction(uuid);
          if (!result.errorMessage) {
            router.push(`/?noteId=${uuid}&toastType=newNote`);
          } else {
            toast.error("Failed to create note");
          }
        }

        // Clear the text for the new note
        setNoteText("");
      }
    }
  };

  const handleSpeechTranscript = (transcript: string) => {
    // Append the transcript to existing text with a space
    const newText = noteText ? `${noteText} ${transcript}` : transcript;
    setNoteText(newText);

    // Update the note
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      const isGuestNote = guestNotes.some((note) => note.id === noteId);

      if (isGuestNote) {
        updateGuestNote(noteId, newText);
      } else if (user) {
        updateNoteAction(noteId, newText);
      }
    }, 1500);

    // Focus the textarea after adding speech text
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end
      textareaRef.current.setSelectionRange(newText.length, newText.length);
    }
  };

  return (
    <div className="relative flex w-full items-end px-3.5 py-2.5">
      <div className="relative flex w-full max-w-4xl flex-col rounded-2xl border bg-white shadow dark:bg-gray-900">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={noteText}
            onChange={handleUpdateNote}
            onKeyDown={handleKeyDown}
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
            <MicrophoneButton onTranscript={handleSpeechTranscript} />
            <AskAIButton user={user} />
            <NewNoteButton user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default NoteTextInput;

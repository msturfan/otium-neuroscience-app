"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";

import { Textarea } from "./ui/textarea";
import NewNoteButton from "./NewNoteButton";
import NotesFeed, { NoteLike } from "./NotesFeed";

import useNote from "@/hooks/useNote";
import { GuestNote } from "@/providers/NoteProvider";
import { updateNoteAction, createNoteAction } from "@/actions/notes";
import MicrophoneButton from "./MicrophoneButton";
import AskAIButton from "./AskAIButton";

type Props = {
  noteId: string;
  startingNoteText: string;
  user: User | null;
  feedNotes?: NoteLike[]; // for authed users (0..1 for this note)
};

export default function NoteTextInput({
  noteId,
  startingNoteText,
  user,
  feedNotes = [],
}: Props) {
  const search = useSearchParams();
  const router = useRouter();
  const noteIdParam = search.get("noteId");

  const {
    noteText,
    setNoteText,
    guestNotes,
    addGuestNote,
    updateGuestNote,
  }: {
    noteText: string;
    setNoteText: (t: string) => void;
    guestNotes: GuestNote[];
    addGuestNote: (n: GuestNote) => void;
    updateGuestNote: (id: string, text: string) => void;
  } = useNote();

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Are we editing the existing note content?
  const [isEditing, setIsEditing] = useState(false);

  // Hide the composer after a successful send (for this visit)
  const [hideAfterSend, setHideAfterSend] = useState(false);

  // Feed scoped to this noteId only
  const feed: NoteLike[] = user
    ? feedNotes
    : (guestNotes.filter((n) => n.id === noteId) as NoteLike[]);
  const currentBubbleText = useMemo(
    () => feed[0]?.text?.toString() ?? "",
    [feed],
  );
  const hasContent = !!currentBubbleText.trim();

  // Show composer only when:
  //  - there is NO existing bubble yet, or
  //  - user explicitly enters Edit mode
  const showComposer = isEditing || (!hasContent && !hideAfterSend);

  // Hydrate composer on first load / when URL matches
  useEffect(() => {
    if (noteIdParam === noteId) {
      const guest = guestNotes.find((n) => n.id === noteId);
      setNoteText(guest ? guest.text : startingNoteText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startingNoteText, noteIdParam, noteId, guestNotes]);

  // Auto-resize textarea
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "40px";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [noteText]);

  // ---------- Helpers ----------
  const upsertGuestNote = (text: string) => {
    const existing = guestNotes.find((n) => n.id === noteId);
    if (existing) updateGuestNote(noteId, text);
    else addGuestNote({ id: noteId, text, createdAt: new Date() });
  };

  // Only autosave while EDITING.
  const scheduleSave = (text: string) => {
    if (!isEditing) return; // â† important: do NOT touch the saved note while composing a new one
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(() => {
      if (!user) upsertGuestNote(text);
      else updateNoteAction(noteId, text);
    }, 1200);
  };

  const flushSaveNow = async (text: string) => {
    if (!isEditing) return; // safety: only flush when editing
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    if (!user) {
      upsertGuestNote(text);
      return;
    }
    const res = await updateNoteAction(noteId, text);
    if (res?.errorMessage) {
      const created = await createNoteAction(noteId);
      if (!created?.errorMessage) await updateNoteAction(noteId, text);
    }
  };

  const handleUpdateNote = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNoteText(text);
    scheduleSave(text);
  };

  // ---------- Send ----------
  // Behavior:
  // - If editing: save edits to the SAME note, then hide composer.
  // - If not editing: create/overwrite the note ON SEND only, then hide composer.
  const sendNote = async () => {
    const textToSave = noteText.trim();
    if (!textToSave) return;

    if (isEditing) {
      await flushSaveNow(textToSave);
      setIsEditing(false);

      // Success message for editing
      toast.success("Note updated successfully");
    } else {
      // First-time send (or re-send in create mode): persist once
      if (!user) {
        upsertGuestNote(textToSave);

        // Show guest login prompt
        toast.info("Please log in or sign up to save your notes", {
          duration: 5000,
          action: {
            label: "Log in",
            onClick: () => router.push("/login"),
          },
        });
      } else {
        const res = await updateNoteAction(noteId, textToSave);
        if (res?.errorMessage) {
          const created = await createNoteAction(noteId);
          if (!created?.errorMessage) {
            await updateNoteAction(noteId, textToSave);
            toast.success("Note created successfully");
          } else {
            toast.error("Failed to create note");
            return; // Don't proceed with clearing if failed
          }
        } else {
          toast.success("Note saved successfully");
        }
      }
    }

    // Clear and hide composer so it no longer edits the note
    setNoteText("");
    setHideAfterSend(true);

    const shell = document.getElementById("shell");
    const hero = document.getElementById("hero-block");
    hero?.classList.add("hidden");
    shell?.classList.remove("justify-center");
    shell?.classList.add("justify-start");

    // Add router refresh to update UI with new note (only for authenticated users)
    if (user) {
      router.refresh();
    }

    // Keep focus behavior the same
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
      textareaRef.current.blur();
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.key === "Enter" || e.keyCode === 13) && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      await sendNote();
    }
  };

  // Speech + Ask AI integrate with the local composer text only
  const handleSpeechTranscript = (transcript: string) => {
    const newText = noteText ? `${noteText} ${transcript}` : transcript;
    setNoteText(newText);

    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(newText.length, newText.length);
    }
  };

  // ---------- Bubble actions ----------
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleEdit = (text: string) => {
    // Enter explicit edit mode: load existing note into composer and show it
    setNoteText(text);
    setIsEditing(true);
    setHideAfterSend(false);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const len = text.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(len, len);
      }
    });
  };

  return (
    <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col">
      {/* Bubble (your UI untouched) */}
      <NotesFeed notes={feed} onCopy={handleCopy} onEdit={handleEdit} />

      {/* Composer (only visible when no note yet, or while editing) */}
      {showComposer && (
        <div className="relative flex w-full items-end px-3.5 py-2.5">
          <div className="relative flex w-full max-w-4xl flex-col rounded-2xl border bg-white shadow dark:bg-gray-900">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={noteText}
                onChange={handleUpdateNote}
                onKeyDown={handleKeyDown}
                placeholder={isEditing ? "Edit your note" : "Write your note"}
                className="custom-scrollbar flex-1 resize-none rounded-t-2xl rounded-b-none border-0 bg-transparent p-4 shadow-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                rows={1}
                style={{ overflowY: "auto", minHeight: 48, maxHeight: 220 }}
              />
            </div>

            <div className="flex items-center justify-between rounded-b-2xl bg-transparent px-4 py-3">
              <div className="flex items-center gap-2" />
              <div className="flex items-center gap-2">
                <MicrophoneButton onTranscript={handleSpeechTranscript} />
                <AskAIButton user={user} noteText={noteText} />
                <NewNoteButton
                  user={user}
                  onSend={sendNote}
                  disabled={!noteText.trim()}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

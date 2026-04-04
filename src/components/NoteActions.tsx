"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { Archive, Loader2, MoreVertical, Pin, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { deleteNoteAction } from "@/actions/notes";
import { deleteNeuroscienceAction } from "@/actions/neuroscience";
import { deleteWorkoutAction } from "@/actions/workout";
import React from "react";
import { usePinnedChats } from "@/hooks/usePinnedChats";

export type NoteComposerKind = "note" | "neuroscience" | "workout";

type Props = {
  noteId: string;
  deleteNoteLocally: (noteId: string) => void;
  isGuest?: boolean;
  onGuestDelete?: () => void;
  composerKind?: NoteComposerKind;
};

function NoteActions({
  noteId,
  deleteNoteLocally,
  isGuest = false,
  onGuestDelete,
  composerKind = "note",
}: Props) {
  const router = useRouter();
  const noteIdParam = useSearchParams().get("noteId") || "";
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const deleteRef = React.useRef<HTMLButtonElement>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const pinnedContext =
    composerKind === "neuroscience"
      ? "neuroscience"
      : composerKind === "workout"
        ? "workout"
        : "otium";
  const { togglePin, isPinned } = usePinnedChats(pinnedContext);

  const handleTogglePin = () => {
    const wasPinned = isPinned(noteId);
    togglePin(noteId);
    toast(wasPinned ? "Chat unpinned" : "Chat pinned", {
      description: wasPinned
        ? "Removed from pinned in the sidebar."
        : "Shown at the top of your sidebar list.",
    });
  };

  const deleteAction =
    composerKind === "neuroscience"
      ? deleteNeuroscienceAction
      : composerKind === "workout"
        ? deleteWorkoutAction
        : deleteNoteAction;
  const redirectPath =
    composerKind === "neuroscience"
      ? "/neuroplasticity"
      : composerKind === "workout"
        ? "/workout"
        : "/";

  const handleDeleteNote = () => {
    if (isGuest && onGuestDelete) {
      onGuestDelete();
      toast("Note Deleted", {
        description: "You have successfully deleted the note",
      });
      return;
    }

    startTransition(async () => {
      const { errorMessage } = await deleteAction(noteId);

      if (!errorMessage) {
        toast("Note Deleted", {
          description: "You have successfully deleted the note",
        });

        deleteNoteLocally(noteId);

        if (noteId === noteIdParam) {
          router.replace(redirectPath);
        }
      } else {
        toast("Error", {
          description: errorMessage,
        });
      }
    });
  };

  const handleArchiveNote = () => {
    if (isGuest && onGuestDelete) {
      onGuestDelete();
      toast("Note Archived", {
        description: "Note has been archived successfully",
      });
      return;
    }

    startTransition(async () => {
      const { errorMessage } = await deleteAction(noteId);

      if (!errorMessage) {
        toast("Note Archived", {
          description: "Note has been archived successfully",
        });

        deleteNoteLocally(noteId);

        if (noteId === noteIdParam) {
          router.replace(redirectPath);
        }
      } else {
        toast("Error", {
          description: errorMessage,
        });
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="absolute top-1/2 right-2 size-7 -translate-y-1/2 p-0 opacity-0 group-hover/item:opacity-100"
            variant="ghost"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={handleTogglePin}
            className="cursor-pointer"
          >
            <Pin className="mr-2 h-4 w-4" />
            {isPinned(noteId) ? "Unpin chat" : "Pin chat"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleArchiveNote}
            className="cursor-pointer"
          >
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-foreground focus:text-foreground cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            (isPending ? cancelRef : deleteRef).current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              Are you sure you want to delete this note?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              note from our servers.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose asChild>
              <Button ref={cancelRef} variant="outline">
                Cancel
              </Button>
            </DialogClose>

            <Button
              ref={deleteRef}
              onClick={() => {
                handleDeleteNote();
                setIsDeleteDialogOpen(false);
              }}
              className="w-24"
              variant="destructive"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default NoteActions;

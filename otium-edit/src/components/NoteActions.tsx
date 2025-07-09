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
import { Archive, Loader2, MoreVertical, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { deleteNoteAction } from "@/actions/notes";

type Props = {
  noteId: string;
  deleteNoteLocally: (noteId: string) => void;
  isGuest?: boolean;
  onGuestDelete?: () => void;
};

function NoteActions({
  noteId,
  deleteNoteLocally,
  isGuest = false,
  onGuestDelete,
}: Props) {
  const router = useRouter();
  const noteIdParam = useSearchParams().get("noteId") || "";
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDeleteNote = () => {
    if (isGuest && onGuestDelete) {
      onGuestDelete();
      toast("Note Deleted", {
        description: "You have successfully deleted the note",
      });
      return;
    }

    startTransition(async () => {
      const { errorMessage } = await deleteNoteAction(noteId);

      if (!errorMessage) {
        toast("Note Deleted", {
          description: "You have successfully deleted the note",
        });

        deleteNoteLocally(noteId);

        if (noteId === noteIdParam) {
          router.replace("/");
        }
      } else {
        toast("Error", {
          description: errorMessage,
        });
      }
    });
  };

  const handleArchiveNote = () => {
    // For now, we'll just delete the note as requested
    // In the future, this will be replaced with archive functionality
    if (isGuest && onGuestDelete) {
      onGuestDelete();
      toast("Note Archived", {
        description: "Note has been archived successfully",
      });
      return;
    }

    startTransition(async () => {
      const { errorMessage } = await deleteNoteAction(noteId);

      if (!errorMessage) {
        toast("Note Archived", {
          description: "Note has been archived successfully",
        });

        deleteNoteLocally(noteId);

        if (noteId === noteIdParam) {
          router.replace("/");
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
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={handleArchiveNote}
            className="cursor-pointer"
          >
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
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
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
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

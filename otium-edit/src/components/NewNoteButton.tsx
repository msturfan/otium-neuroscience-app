"use client";

import { User } from "@supabase/supabase-js";
import { Button } from "./ui/button";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { createNoteAction } from "@/actions/notes";
import { toast } from "sonner";
import useNote from "@/hooks/useNote";
import { GuestNote } from "@/providers/NoteProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  user: User | null;
};

function NewNoteButton({ user }: Props) {
  const router = useRouter();
  const { addGuestNote } = useNote();

  const [loading, setLoading] = useState(false);

  const handleClickNewNoteButton = async () => {
    setLoading(true);
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

    setLoading(false);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleClickNewNoteButton}
          size="sm"
          className="h-8 w-8 rounded-full p-0"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Send note (Enter)</p>
        <p className="text-muted-foreground text-xs">
          Shift+Enter for new line
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export default NewNoteButton;

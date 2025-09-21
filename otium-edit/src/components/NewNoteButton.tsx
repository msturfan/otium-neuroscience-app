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
  onSend?: () => Promise<void> | void;
  disabled?: boolean;
  label?: string;
};

export default function NewNoteButton({ onSend, disabled, label }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (disabled || loading) return;
    setLoading(true);
    try {
      await onSend?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          disabled={loading || disabled}
          onClick={handleClick}
          size="sm"
          className="h-8 w-8 rounded-full p-0"
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

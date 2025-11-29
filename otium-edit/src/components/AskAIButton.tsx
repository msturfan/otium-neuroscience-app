"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { AISuggestionsDialog } from "./AISuggestionsDialog";

type Props = {
  user: User | null;
  noteText: string;
};

function AskAIButton({ user, noteText }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleClick = () => {
    if (!noteText.trim() || noteText.trim().length < 20) {
      toast.info("Write more content", {
        description:
          "Write a few lines about your day first, then I can suggest improvements.",
      });
      return;
    }
    setIsDialogOpen(true);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            className="h-8 w-8 rounded-full p-0"
            onClick={handleClick}
            disabled={!noteText.trim() || noteText.trim().length < 20}
          >
            <Sparkles
              className="h-4 w-4 shrink-0 text-white transition-transform group-hover:rotate-6 dark:text-black"
              strokeWidth={2}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Ask AI for suggestions</p>
          <p className="text-muted-foreground text-xs">
            Get tips to improve your daily note
          </p>
        </TooltipContent>
      </Tooltip>

      <AISuggestionsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        noteText={noteText}
      />
    </>
  );
}

export default AskAIButton;

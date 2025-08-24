"use client";

import { User } from "@supabase/supabase-js";
import { Button } from "./ui/button";
import { Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type Props = {
  user: User | null;
};

function AskAIButton({ user }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="sm" className="h-8 w-8 rounded-full p-0">
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
  );
}

export default AskAIButton;

"use client";

import { User } from "@supabase/supabase-js";
import { Button } from "./ui/button";
import { Sparkles } from "lucide-react";

type Props = {
  user: User | null;
};

function AskAIButton({ user }: Props) {
  return (
    <Button size="sm" className="h-8 w-8 rounded-full p-0" title="Ask AI">
      <Sparkles
        className="h-4 w-4 shrink-0 text-white dark:text-black transition-transform group-hover:rotate-6"
        strokeWidth={2}
      />
    </Button>
  );
}

export default AskAIButton;

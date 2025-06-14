"use client";

import { User } from "@supabase/supabase-js" 
import { Button } from "./ui/button";

type Props = {
    user: User | null;
} 

function AskAIButton({user}: Props) {
  return (
    <Button>Ask AI</Button>
  )
}

export default AskAIButton
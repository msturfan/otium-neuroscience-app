"use client";

import { User } from "@supabase/supabase-js";
import { Button } from "./ui/button";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { createNoteAction } from "@/actions/notes";

type Props = {
  user: User | null;
};

function NewNoteButton({ user }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const handleClickNewNoteButton = async () => {
    if (!user) {
      router.push("/login");
    } else {
      setLoading(true);

      const uuid = uuidv4();
      await createNoteAction(uuid);
      router.push(`/?noteId=${uuid}&toastType=newNote`);

      setLoading(false);
    }
  };
  

  return (
    <Button
      onClick={handleClickNewNoteButton}
      size="sm"
      className="h-8 w-8 rounded-full p-0"
      disabled={loading}
      title="New Note"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Send className="h-4 w-4" />
      )}
    </Button>
  );
}

export default NewNoteButton;

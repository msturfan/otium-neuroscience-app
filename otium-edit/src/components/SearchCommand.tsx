"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { fetchUserNotesAction } from "@/actions/notes";
import useNote from "@/hooks/useNote";
import { getUser } from "@/auth/server";

type UserNote = {
  id: string;
  text: string;
  createdAt: Date;
};

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userNotes, setUserNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(false);
  const { guestNotes } = useNote();
  const router = useRouter();

  // Fetch user notes when dialog opens
  useEffect(() => {
    if (open) {
      fetchNotes();
    }
  }, [open]);

  const fetchNotes = async () => {
    setLoading(true);
    const { notes, errorMessage } = await fetchUserNotesAction();
    if (!errorMessage) {
      setUserNotes(notes);
    }
    setLoading(false);
  };

  // Filter notes based on search query
  const filteredNotes = [...userNotes, ...guestNotes].filter((note) => {
    if (!searchQuery.trim()) return true;
    return note.text.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleNoteClick = (noteId: string) => {
    setOpen(false);
    setSearchQuery("");
    router.push(`/?noteId=${noteId}`);
  };

  const getNoteTitle = (text: string) => {
    if (!text.trim()) return "Untitled Note";
    const firstLine = text.split("\n")[0];
    return firstLine.length > 50
      ? firstLine.substring(0, 50) + "..."
      : firstLine;
  };

  const getNotePreview = (text: string) => {
    if (!text.trim()) return "Empty note";
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length === 0) return "Empty note";

    const firstLine = lines[0];
    if (firstLine.length > 100) {
      return firstLine.substring(0, 100) + "...";
    }

    if (lines.length > 1) {
      return firstLine + " " + lines[1].substring(0, 50) + "...";
    }

    return firstLine;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 px-3 justify-start"
        title="Search"
      >
        <Search className="h-4 w-4" />
        <span>Search</span>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search your notes..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>
            {loading ? (
              <div className="text-muted-foreground py-6 text-center text-sm">
                Loading notes...
              </div>
            ) : searchQuery ? (
              <div className="text-muted-foreground py-6 text-center text-sm">
                No notes found matching "{searchQuery}"
              </div>
            ) : (
              <div className="text-muted-foreground py-6 text-center text-sm">
                No notes yet. Create your first note to get started.
              </div>
            )}
          </CommandEmpty>

          {filteredNotes.length > 0 && (
            <CommandGroup heading="Notes">
              {filteredNotes.map((note) => (
                <CommandItem
                  key={note.id}
                  onSelect={() => handleNoteClick(note.id)}
                  className="flex flex-col items-start gap-1 p-3"
                >
                  <div className="flex w-full items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="text-muted-foreground h-4 w-4" />
                      <span className="font-medium">
                        {getNoteTitle(note.text)}
                      </span>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      {formatDate(note.createdAt)}
                    </div>
                  </div>
                  <p className="text-muted-foreground ml-6 line-clamp-2 text-sm">
                    {getNotePreview(note.text)}
                  </p>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

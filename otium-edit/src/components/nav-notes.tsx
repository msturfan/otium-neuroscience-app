"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fetchUserNotesAction } from "@/actions/notes";
import { formatNoteDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import useNote from "@/hooks/useNote";
import NoteActions from "./NoteActions";
import { User } from "@supabase/supabase-js";

type UserNote = {
  id: string;
  text: string;
  token?: string; // Make token optional temporarily
  createdAt: Date;
};

type Props = {
  user: User | null;
};

export function NavNotes({ user }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentNoteId = searchParams.get("noteId");

  const [userNotes, setUserNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(true);
  const { guestNotes, deleteGuestNote } = useNote();

  // Fetch user notes on mount or when user changes
  useEffect(() => {
    const fetchNotes = async () => {
      if (user) {
        setLoading(true);
        const { notes, errorMessage } = await fetchUserNotesAction();
        if (!errorMessage) {
          setUserNotes(notes);
        } else {
          toast.error("Failed to load notes");
        }
        setLoading(false);
      } else {
        setUserNotes([]);
        setLoading(false);
      }
    };

    fetchNotes();
  }, [user]);

  const handleNoteClick = (noteId: string) => {
    router.push(`/?noteId=${noteId}`);
  };

  const handleCopyLink = (token: string | undefined) => {
    if (!token) {
      toast.error("Link sharing is temporarily unavailable");
      return;
    }
    const url = `${window.location.origin}/c/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const deleteNoteLocally = (noteId: string) => {
    setUserNotes((prev) => prev.filter((note) => note.id !== noteId));
  };

  const getNoteTitle = (text: string) => {
    if (!text.trim()) return "Untitled Note";
    // Get first line or first 30 characters
    const firstLine = text.split("\n")[0];
    return firstLine.length > 30
      ? firstLine.substring(0, 30) + "..."
      : firstLine;
  };

  const displayNotes = user ? userNotes : guestNotes;
  const isGuest = !user;

  if (loading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>My Notes</SidebarGroupLabel>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        My Notes
        {isGuest && (
          <Badge variant="secondary" className="ml-2 text-xs">
            Guest
          </Badge>
        )}
      </SidebarGroupLabel>

      {displayNotes.length === 0 ? (
        <div className="px-3 py-8 text-center">
          <Image
            src="/otium_gray.png"
            alt="Otium Logo"
            width={150}
            height={150}
            className="mx-auto opacity-30"
          />
          <p className="text-muted-foreground mt-2 text-sm">
            {isGuest
              ? "No notes yet. Start writing to see them here!"
              : "No notes yet. Create your first note!"}
          </p>
        </div>
      ) : (
        <SidebarMenu>
          {displayNotes.map((note) => (
            <SidebarMenuItem key={note.id} className="group/item relative">
              <SidebarMenuButton
                isActive={currentNoteId === note.id}
                onClick={() => handleNoteClick(note.id)}
                className="pr-20"
              >
                <FileText className="h-4 w-4" />
                <div className="flex-1 overflow-hidden">
                  <div className="truncate text-sm">
                    {getNoteTitle(note.text)}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {formatNoteDate(note.createdAt)}
                  </div>
                </div>
              </SidebarMenuButton>

              {user ? (
                <>
                  {"token" in note && note.token && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1/2 right-10 h-7 w-7 -translate-y-1/2 p-0 opacity-0 group-hover/item:opacity-100"
                          onClick={() =>
                            handleCopyLink((note as UserNote).token)
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy link</TooltipContent>
                    </Tooltip>
                  )}
                  <NoteActions
                    noteId={note.id}
                    deleteNoteLocally={deleteNoteLocally}
                  />
                </>
              ) : (
                <NoteActions
                  noteId={note.id}
                  deleteNoteLocally={deleteNoteLocally}
                  isGuest={true}
                  onGuestDelete={() => deleteGuestNote(note.id)}
                />
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      )}

      {isGuest && displayNotes.length > 0 && (
        <div className="mt-4 px-3">
          <p className="text-muted-foreground text-xs">
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => router.push("/login")}
            >
              Log in
            </Button>
            {" or "}
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => router.push("/sign-up")}
            >
              sign up
            </Button>
            {" to save your notes"}
          </p>
        </div>
      )}
    </SidebarGroup>
  );
}

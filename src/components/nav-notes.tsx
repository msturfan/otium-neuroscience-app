"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronRight, Copy, Loader2, Pin } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fetchUserNotesAction } from "@/actions/notes";
import { fetchUserNeuroscienceAction } from "@/actions/neuroscience";
import { Badge } from "@/components/ui/badge";
import useNote from "@/hooks/useNote";
import NoteActions from "./NoteActions";
import { User } from "@supabase/supabase-js";
import { usePinnedChats } from "@/hooks/usePinnedChats";

type UserNote = {
  id: string;
  text: string;
  title?: string | null;
  token?: string;
  createdAt: Date;
};

type Props = {
  user: User | null;
  onKnownNoteIdsChange?: (ids: Set<string> | null) => void;
};

const SIDEBAR_NOTES_EXPANDED_KEY = "otium.sidebar.myNotesExpanded";
const SIDEBAR_NEUROSCIENCE_EXPANDED_KEY = "otium.sidebar.neuroscienceExpanded";

export function NavNotes({ user, onKnownNoteIdsChange }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentNoteId = searchParams.get("noteId");
  
  const isNeuroplasticity = pathname.startsWith("/neuroplasticity");

  const expandedStorageKey = isNeuroplasticity
    ? SIDEBAR_NEUROSCIENCE_EXPANDED_KEY
    : SIDEBAR_NOTES_EXPANDED_KEY;

  const [sectionOpen, setSectionOpen] = useState(true);
  const [userNotes, setUserNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(true);
  const { guestNotes, deleteGuestNote } = useNote();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(expandedStorageKey);
      setSectionOpen(stored === null ? true : stored === "true");
    } catch {
      setSectionOpen(true);
    }
  }, [expandedStorageKey]);

  const handleSectionOpenChange = (open: boolean) => {
    setSectionOpen(open);
    try {
      localStorage.setItem(expandedStorageKey, String(open));
    } catch {
      /* ignore */
    }
  };

  // Fetch user notes on mount or when user/path changes
  useEffect(() => {
    const fetchNotes = async () => {
      if (user) {
        setLoading(true);
        const { notes, errorMessage } = isNeuroplasticity 
          ? await fetchUserNeuroscienceAction()
          : await fetchUserNotesAction();
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
  }, [user, isNeuroplasticity]);

  const handleNoteClick = (noteId: string) => {
    const basePath = isNeuroplasticity ? "/neuroplasticity" : "/";
    router.push(`${basePath}?noteId=${noteId}`);
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

  const getNoteTitle = (
    note:
      | UserNote
      | { id: string; text: string; title?: string | null; createdAt: Date },
  ) => {
    // Use AI-generated title if available
    if (note.title && note.title.trim()) {
      return note.title;
    }

    // Fallback to first line or first 30 characters
    if (!note.text.trim()) return "Empty Note";
    const firstLine = note.text.split("\n")[0];
    return firstLine.length > 30
      ? firstLine.substring(0, 30) + "..."
      : firstLine;
  };

  const displayNotes = user ? userNotes : guestNotes;
  const isGuest = !user;

  const { pinnedIds } = usePinnedChats(isNeuroplasticity);

  useEffect(() => {
    if (!onKnownNoteIdsChange) return;
    if (loading) {
      onKnownNoteIdsChange(null);
      return;
    }
    onKnownNoteIdsChange(new Set(displayNotes.map((n) => n.id)));
  }, [loading, displayNotes, onKnownNoteIdsChange]);

  const orderedNotes = useMemo(() => {
    const pinSet = new Set(pinnedIds);
    const pinnedOrdered = pinnedIds
      .map((id) => displayNotes.find((n) => n.id === id))
      .filter((n): n is (typeof displayNotes)[number] => Boolean(n));
    const unpinned = displayNotes.filter((n) => !pinSet.has(n.id));
    return [...pinnedOrdered, ...unpinned];
  }, [displayNotes, pinnedIds]);

  const sectionTitle = isNeuroplasticity ? "Neuroscience" : "My Notes";
  const toggleAriaLabel = sectionOpen
    ? `Hide ${sectionTitle}`
    : `Show ${sectionTitle}`;

  return (
    <SidebarGroup>
      <Collapsible open={sectionOpen} onOpenChange={handleSectionOpenChange}>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger
            type="button"
            aria-expanded={sectionOpen}
            aria-label={toggleAriaLabel}
            className={cn(
              "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground w-full cursor-pointer gap-2 pr-2 text-left",
            )}
          >
            <ChevronRight
              className={cn(
                "shrink-0 transition-transform duration-200",
                sectionOpen && "rotate-90",
              )}
              aria-hidden
            />
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className="truncate">{sectionTitle}</span>
              {isGuest && (
                <Badge variant="secondary" className="text-xs normal-case">
                  Guest
                </Badge>
              )}
            </span>
          </CollapsibleTrigger>
        </SidebarGroupLabel>

        <CollapsibleContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : orderedNotes.length === 0 ? (
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
              {orderedNotes.map((note) => {
                const isPinned = pinnedIds.includes(note.id);
                return (
                <SidebarMenuItem key={note.id} className="group/item relative">
                  <SidebarMenuButton
                    isActive={currentNoteId === note.id}
                    onClick={() => handleNoteClick(note.id)}
                    className={cn(
                      "pr-10",
                      // Pinned rows: only show the pin icon; do not use accent fill (reads as “selected”).
                      isPinned && "justify-between gap-2",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {getNoteTitle(note)}
                    </span>
                    {isPinned ? (
                      <Pin
                        className="text-muted-foreground h-3.5 w-3.5 shrink-0"
                        aria-hidden
                      />
                    ) : null}
                  </SidebarMenuButton>

                  {user ? (
                    <>
                      {"token" in note && note.token && !isNeuroplasticity && (
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
                        isNeuroscience={isNeuroplasticity}
                      />
                    </>
                  ) : (
                    <NoteActions
                      noteId={note.id}
                      deleteNoteLocally={deleteNoteLocally}
                      isGuest={true}
                      onGuestDelete={() => deleteGuestNote(note.id)}
                      isNeuroscience={isNeuroplasticity}
                    />
                  )}
                </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          )}

          {!loading && isGuest && orderedNotes.length > 0 && (
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
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}

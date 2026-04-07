"use client";

import { useSearchParams, useRouter } from "next/navigation";
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import { Dumbbell, Plus, Square } from "lucide-react";
import { IconCalendarEventFilled, IconXFilled } from "@tabler/icons-react";

import { Textarea } from "./ui/textarea";
import NewNoteButton from "./NewNoteButton";
import NotesFeed, { NoteLike } from "./NotesFeed";

import useNote from "@/hooks/useNote";
import { GuestNote } from "@/providers/NoteProvider";
import {
  updateWorkoutAction,
  createWorkoutAction,
  deleteWorkoutAction,
} from "@/actions/workout";
//import { generateNoteTitle } from "@/actions/generate-title";
import MicrophoneButton from "./MicrophoneButton";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NOTE_PERSISTED_EVENT } from "@/components/nav-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOptionalWorkoutProfileEditor } from "@/providers/WorkoutProfileEditorProvider";
import { getWorkoutProgramLogoDefinition } from "@/lib/workout/workoutProgramLogos";
import { cn } from "@/lib/utils";

const WORKOUT_PRE_CREATE_NOTE_ID_KEY = "otium.workout.preCreateNoteId";

type Props = {
  noteId: string;
  startingNoteText: string;
  user: User | null;
  feedNotes?: NoteLike[];
  greeting?: string;
  welcomeMessage?: string;
};

export default function WorkoutTextInput({
  noteId,
  startingNoteText,
  user,
  feedNotes = [],
  greeting = "What's on your mind?",
  welcomeMessage,
}: Props) {
  const search = useSearchParams();
  const router = useRouter();
  const noteIdParam = search.get("noteId");

  const {
    noteText,
    setNoteText,
    guestNotes,
    addGuestNote,
    updateGuestNote,
  }: {
    noteText: string;
    setNoteText: (t: string) => void;
    guestNotes: GuestNote[];
    addGuestNote: (n: GuestNote) => void;
    updateGuestNote: (id: string, text: string, title?: string | null) => void;
  } = useNote();

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Prevent typewriter animation from running during SSR/hydration
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Track if user has typed - prevent typewriter from showing again after clearing
  const [hasTyped, setHasTyped] = useState(false);

  // Chat messages for the conversation (user messages + AI responses)
  const [chatMessages, setChatMessages] = useState<NoteLike[]>([]);

  // Track the current noteId to detect when it changes
  const [currentNoteId, setCurrentNoteId] = useState(noteId);

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);

  const workoutProfileEditor = useOptionalWorkoutProfileEditor();
  const { Icon: WorkoutProgramProfileIcon } = getWorkoutProgramLogoDefinition(
    workoutProfileEditor?.workoutProgramLogoId,
  );
  const [workoutProgramComposerActive, setWorkoutProgramComposerActive] =
    useState(false);
  const [workoutAddIconRotating, setWorkoutAddIconRotating] = useState(false);
  const [workoutAddMenuOpen, setWorkoutAddMenuOpen] = useState(false);
  /** Drives profile → IconXFilled swap; CSS `group-hover` is unreliable with Tailwind v4 named groups (e.g. `group/sidebar-wrapper`). */
  const [workoutAddTriggerHovered, setWorkoutAddTriggerHovered] =
    useState(false);

  useEffect(() => {
    if (!workoutProgramComposerActive) {
      setWorkoutAddTriggerHovered(false);
    }
  }, [workoutProgramComposerActive]);

  // Feed scoped to this noteId only
  const userNotes: NoteLike[] = user
    ? feedNotes
    : (guestNotes.filter((n) => n.id === noteId) as NoteLike[]);

  // Check if there's user note content
  const hasUserNoteContent = useMemo(() => {
    return userNotes.length > 0 && userNotes[0]?.text?.trim().length > 0;
  }, [userNotes]);

  // Save chat messages to sessionStorage whenever they change
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      chatMessages.length > 0 &&
      currentNoteId === noteId
    ) {
      try {
        const messagesToSave = chatMessages.filter(
          (m) => !m.isLoading && m.text,
        );
        if (messagesToSave.length > 0) {
          const serialized = JSON.stringify(messagesToSave);
          sessionStorage.setItem(`chat-workout-${noteId}`, serialized);
        }
      } catch (error) {
        console.error("Failed to save chat messages to sessionStorage:", error);
      }
    }
  }, [chatMessages, noteId, currentNoteId]);

  // Handle noteId changes and load appropriate messages
  useEffect(() => {
    if (currentNoteId !== noteId) {
      setChatMessages([]);
      setCurrentNoteId(noteId);
      setHasTyped(false);

      // Stop any ongoing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsStreaming(false);

      if (typeof window !== "undefined") {
        try {
          const stored = sessionStorage.getItem(`chat-workout-${noteId}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.length > 0) setChatMessages(parsed);
          }
        } catch (error) {
          console.error("Failed to reload chat messages:", error);
        }
      }
    } else if (typeof window !== "undefined") {
      if (chatMessages.length === 0) {
        try {
          const stored = sessionStorage.getItem(`chat-workout-${noteId}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.length > 0) setChatMessages(parsed);
          }
        } catch (error) {
          console.error("Failed to reload chat messages:", error);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, currentNoteId]);

  // Combine user notes and chat messages, sorted by creation time.
  // Avoid showing the initial user note twice once chatMessages has it.
  const feed: NoteLike[] = useMemo(() => {
    const chatUserTexts = new Set(
      chatMessages
        .filter((m) => !m.isAI && m.text?.trim())
        .map((m) => m.text.trim()),
    );
    const filteredUserNotes = userNotes.filter(
      (n) => !chatUserTexts.has(n.text?.trim() ?? ""),
    );
    const combined = [...filteredUserNotes, ...chatMessages];
    return combined.sort(
      (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt),
    );
  }, [userNotes, chatMessages]);

  const hasContent = feed.some((n) => n.text?.trim());

  // Hydrate composer on first load / when URL matches
  useEffect(() => {
    if (
      noteIdParam === noteId &&
      !hasTyped &&
      !noteText &&
      !hasContent &&
      chatMessages.length === 0
    ) {
      const guest = guestNotes.find((n) => n.id === noteId);
      setNoteText(guest ? guest.text : startingNoteText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    startingNoteText,
    noteIdParam,
    noteId,
    guestNotes,
    hasTyped,
    noteText,
    hasContent,
    chatMessages.length,
  ]);

  // Auto-resize textarea: grow to N lines, then scroll inside.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || typeof window === "undefined") return;
    const styles = window.getComputedStyle(textarea);
    const lineHeight = Number.parseFloat(styles.lineHeight) || 20;
    const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
    const maxRows = 6;
    const maxHeight = lineHeight * maxRows + paddingTop + paddingBottom;

    textarea.style.height = "0px";
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [noteText]);

  const upsertGuestNote = async (text: string) => {
    const existing = guestNotes.find((n) => n.id === noteId);
    const title: string | null = null;
    if (text.trim().length > 20) {
      //title = await generateNoteTitle(text);
    }
    if (existing) {
      updateGuestNote(noteId, text, title);
    } else {
      addGuestNote({ id: noteId, text, title, createdAt: new Date() });
    }
  };

  const handleUpdateNote = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNoteText(text);
    if (!hasTyped && text.length > 0) {
      setHasTyped(true);
    }
  };

  // ---------- Streaming AI response ----------
  const streamAIResponse = useCallback(
    async (userMessage: string) => {
      const aiMessageId = `ai-stream-${Date.now()}`;
      streamingMessageIdRef.current = aiMessageId;

      // Add loading bubble
      setChatMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
          text: "",
          createdAt: new Date(),
          isAI: true,
          isLoading: true,
        },
      ]);

      // Build conversation history for context
      const conversationHistory = chatMessages
        .filter((m) => m.text?.trim() && !m.isLoading)
        .map((m) => ({
          role: m.isAI ? ("assistant" as const) : ("user" as const),
          content: m.text,
        }));

      // Also include the first user note if it exists
      if (hasUserNoteContent && userNotes[0]?.text?.trim()) {
        conversationHistory.unshift({
          role: "user" as const,
          content: userNotes[0].text,
        });
      }

      // System prompt is injected server-side in the API route
      const messages = [
        ...conversationHistory,
        { role: "user" as const, content: userMessage },
      ];

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsStreaming(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, promptType: "workout" }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error("Failed to get streaming response");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        // Replace loading with empty streaming bubble
        setChatMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId ? { ...m, isLoading: false, text: "" } : m,
          ),
        );

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          accumulated += text;

          // Update the AI message with accumulated text
          setChatMessages((prev) =>
            prev.map((m) =>
              m.id === aiMessageId ? { ...m, text: accumulated } : m,
            ),
          );
        }

        // Final update
        if (accumulated.trim()) {
          setChatMessages((prev) =>
            prev.map((m) =>
              m.id === aiMessageId
                ? { ...m, text: accumulated.trim(), isLoading: false }
                : m,
            ),
          );
        } else {
          // If no text was received, remove the bubble
          setChatMessages((prev) => prev.filter((m) => m.id !== aiMessageId));
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          // User stopped the stream — keep whatever was accumulated
          setChatMessages((prev) =>
            prev.map((m) =>
              m.id === aiMessageId ? { ...m, isLoading: false } : m,
            ),
          );
        } else {
          console.error("Streaming error:", error);
          // Remove loading bubble and fall back to non-streaming
          setChatMessages((prev) => prev.filter((m) => m.id !== aiMessageId));
          await fallbackNonStreaming();
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
        streamingMessageIdRef.current = null;

        // Focus textarea for follow-up
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, 100);
      }
    },
    [chatMessages, hasUserNoteContent, userNotes],
  );

  const fallbackNonStreaming = async () => {
    setChatMessages((prev) => [
      ...prev,
      {
        id: `ai-error-${Date.now()}`,
        text: "I couldn’t generate a response right now. Try again, or add your goal, available time, and any equipment you have.",
        createdAt: new Date(),
        isAI: true,
      },
    ]);
  };

  // Stop streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // ---------- Send ----------
  const sendNote = async () => {
    const textToSave = noteText.trim();
    if (!textToSave) return;

    const isFirstMessage = !hasContent;

    // Add user's message to the chat feed immediately
    const userMessageId = `user-msg-${Date.now()}`;
    setChatMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        text: textToSave,
        createdAt: new Date(),
        isAI: false,
      },
    ]);

    // Clear text immediately
    setNoteText("");

    // Persist the note
    if (isFirstMessage) {
      if (!user) {
        await upsertGuestNote(textToSave);
        toast.info("Please log in or sign up to save your notes", {
          duration: 5000,
          action: {
            label: "Log in",
            onClick: () => router.push("/login"),
          },
        });
      } else {
        const res = await updateWorkoutAction(noteId, textToSave);
        if (res?.errorMessage) {
          const created = await createWorkoutAction(noteId);
          if (!created?.errorMessage) {
            await updateWorkoutAction(noteId, textToSave);
            window.dispatchEvent(
              new CustomEvent(NOTE_PERSISTED_EVENT, {
                detail: { noteId },
              }),
            );
          } else {
            toast.error("Failed to create note");
            return;
          }
        } else {
          window.dispatchEvent(
            new CustomEvent(NOTE_PERSISTED_EVENT, {
              detail: { noteId },
            }),
          );
        }
      }
    }

    // Move shell to top alignment
    const shell = document.getElementById("shell");
    shell?.classList.remove("justify-center");
    shell?.classList.add("justify-start");

    // Refresh to update sidebar (only for authenticated users)
    if (user && isFirstMessage) {
      router.refresh();
    }

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
    }

    // Stream AI response for every message
    await streamAIResponse(textToSave);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.key === "Enter" || e.keyCode === 13) && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      await sendNote();
    }
  };

  // Speech integration
  const handleSpeechTranscript = (transcript: string) => {
    const newText = noteText ? `${noteText} ${transcript}` : transcript;
    setNoteText(newText);
    if (!hasTyped && newText.length > 0) {
      setHasTyped(true);
    }
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(newText.length, newText.length);
    }
  };

  // ---------- Bubble actions ----------
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleEdit = (text: string) => {
    setNoteText(text);
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const len = text.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(len, len);
      }
    });
  };

  const handleCreateWorkoutProgram = useCallback(() => {
    setWorkoutAddTriggerHovered(false);
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(WORKOUT_PRE_CREATE_NOTE_ID_KEY, noteId);
      }
    } catch {
      /* ignore */
    }
    setWorkoutAddIconRotating(true);
    setWorkoutProgramComposerActive(true);
    const newId = crypto.randomUUID();
    // Do NOT pre-create the DB record here — that caused an empty note to appear
    // in the sidebar before the user typed anything. sendNote (via updateWorkoutAction's
    // built-in upsert) will create the record on first actual submission.
    router.push(`/workout?noteId=${newId}`);
    window.setTimeout(() => {
      setWorkoutAddIconRotating(false);
    }, 600);
  }, [router, noteId]);

  const handleCancelWorkoutProgram = useCallback(async () => {
    setWorkoutAddTriggerHovered(false);
    setWorkoutProgramComposerActive(false);
    setWorkoutAddMenuOpen(false);

    let returnNoteId: string | null = null;
    try {
      if (typeof window !== "undefined") {
        returnNoteId = sessionStorage.getItem(WORKOUT_PRE_CREATE_NOTE_ID_KEY);
        sessionStorage.removeItem(WORKOUT_PRE_CREATE_NOTE_ID_KEY);
      }
    } catch {
      /* ignore */
    }

    await deleteWorkoutAction(noteId);

    if (returnNoteId && returnNoteId !== noteId) {
      router.replace(`/workout?noteId=${returnNoteId}`);
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.replace("/workout");
    }
  }, [router, noteId]);

  const addMenuButtonClassName = cn(
    "theme-toggle-button relative h-8 w-8 shrink-0 overflow-hidden rounded-full p-0 text-muted-foreground hover:text-foreground",
    "transition-all duration-200 ease-out hover:bg-accent/50 active:scale-95",
  );

  /** Create-workout mode — use real blue: theme `primary` is near-black in :root, not a blue. */
  const addMenuComposerActiveClassName = cn(
    addMenuButtonClassName,
    "shadow-none hover:shadow-none hover:!shadow-none",
    /* Keep chip when profile icon is shown and when X (cancel) is shown — beat ghost + .theme-toggle-button:hover */
    "bg-blue-500/20 text-blue-700 ring-blue-500/55",
    "hover:!bg-blue-500/30 hover:!text-blue-800 hover:!ring-blue-600/65",
    "dark:bg-blue-400/20 dark:text-blue-300 dark:ring-blue-400/50",
    "dark:hover:!bg-blue-400/28 dark:hover:!text-blue-200 dark:hover:!ring-blue-300/60",
    "ring-2 ring-inset",
    "focus-visible:ring-2 focus-visible:ring-inset focus-visible:!ring-blue-600 dark:focus-visible:!ring-blue-400",
  );

  const showComposerCancelIcon =
    workoutProgramComposerActive && workoutAddTriggerHovered;

  const addMenuIconStack = useMemo(
    () => (
      <div className="relative flex h-4 w-4 items-center justify-center">
        <Plus
          className={cn(
            "theme-toggle-icon pointer-events-none absolute h-4 w-4",
            "transition-all duration-500 ease-in-out",
            workoutProgramComposerActive
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100",
          )}
        />
        <WorkoutProgramProfileIcon
          className={cn(
            "theme-toggle-icon pointer-events-none absolute z-[1] h-4 w-4",
            workoutProgramComposerActive
              ? cn(
                  "transition-all duration-300 ease-in-out",
                  !showComposerCancelIcon &&
                    "rotate-0 scale-100 opacity-100",
                  showComposerCancelIcon &&
                    "z-0 -rotate-90 scale-0 opacity-0",
                  workoutAddIconRotating && "rotating",
                )
              : cn(
                  "transition-all duration-500 ease-in-out",
                  "-rotate-90 scale-0 opacity-0",
                ),
          )}
        />
        <IconXFilled
          className={cn(
            "theme-toggle-icon pointer-events-none absolute z-[2] h-4 w-4",
            "transition-all duration-300 ease-in-out",
            !workoutProgramComposerActive && "scale-0 opacity-0",
            workoutProgramComposerActive &&
              cn(
                !showComposerCancelIcon &&
                  "-rotate-90 scale-0 opacity-0",
                showComposerCancelIcon &&
                  "rotate-0 scale-100 opacity-100",
              ),
          )}
          aria-hidden
        />
      </div>
    ),
    [
      WorkoutProgramProfileIcon,
      showComposerCancelIcon,
      workoutAddIconRotating,
      workoutProgramComposerActive,
    ],
  );

  return (
    <div
      className={`relative mx-auto flex h-full min-h-0 w-full max-w-3xl flex-1 flex-col ${
        hasContent ? "" : "justify-center"
      }`}
    >
      {/* Chat feed */}
      {hasContent && (
        <div className="min-h-0 flex-1 overflow-y-auto pb-28">
          <NotesFeed notes={feed} onCopy={handleCopy} onEdit={handleEdit} />
        </div>
      )}

      {!hasContent && welcomeMessage && (
        <div className="mb-3 flex flex-col items-center text-center">
          <Dumbbell className="mb-1 h-6 w-6 text-foreground" />
          <span
            className="text-sm font-medium text-foreground md:text-base"
            style={{
              backgroundImage: "none",
              WebkitBackgroundClip: "unset",
              backgroundClip: "unset",
            }}
          >
            {welcomeMessage}
          </span>
        </div>
      )}

      {/* Composer — always visible for follow-up questions */}
      <div className="relative flex w-full items-center px-3.5 py-2.5">
        <div className="relative flex w-full max-w-4xl flex-col rounded-2xl border bg-white shadow dark:bg-gray-900">
          {/* Flex row: + button is a sibling of the textarea column so placeholders never share its layout box */}
          <div className="flex w-full min-h-0 items-center gap-1.5 px-2 pb-2.5 pt-1">
            {workoutProgramComposerActive ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isStreaming}
                data-workout-composer-chip=""
                onPointerEnter={() => setWorkoutAddTriggerHovered(true)}
                onPointerLeave={() => setWorkoutAddTriggerHovered(false)}
                onFocus={() => setWorkoutAddTriggerHovered(true)}
                onBlur={() => setWorkoutAddTriggerHovered(false)}
                onClick={() => void handleCancelWorkoutProgram()}
                className={addMenuComposerActiveClassName}
                aria-label="Cancel workout program"
              >
                {addMenuIconStack}
              </Button>
            ) : (
              <DropdownMenu
                open={workoutAddMenuOpen}
                onOpenChange={setWorkoutAddMenuOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={isStreaming}
                    className={addMenuButtonClassName}
                    aria-label="Add workout program"
                  >
                    {addMenuIconStack}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" className="min-w-[14rem]">
                  <DropdownMenuItem
                    className="gap-2"
                    onSelect={() => handleCreateWorkoutProgram()}
                  >
                    <IconCalendarEventFilled className="size-4 shrink-0 opacity-80" />
                    Create Workout Program
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <div className="relative min-h-[48px] min-w-0 flex-1">
              <Textarea
                ref={textareaRef}
                value={noteText}
                onChange={handleUpdateNote}
                onKeyDown={handleKeyDown}
                placeholder=""
                disabled={isStreaming}
                className="custom-scrollbar field-sizing-fixed min-h-[48px] w-full resize-none rounded-xl border-0 bg-transparent py-4 pr-28 pl-3 shadow-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                rows={1}
                style={{ minHeight: 48 }}
              />
              <div className="absolute right-2 bottom-2.5 z-[1] flex items-center gap-1.5">
                {isStreaming ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleStopStreaming}
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 rounded-full border border-black bg-black p-0 text-white hover:bg-black/90 dark:border-white dark:bg-white dark:text-black dark:hover:bg-white/90"
                      >
                        <Square className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Stop generating</TooltipContent>
                  </Tooltip>
                ) : (
                  <>
                    <MicrophoneButton onTranscript={handleSpeechTranscript} />
                    <NewNoteButton
                      user={user}
                      onSend={sendNote}
                      disabled={!noteText.trim()}
                    />
                  </>
                )}
              </div>
              {!noteText && !hasTyped && !hasContent && (
                <div
                  className="pointer-events-none absolute inset-0 flex items-start pt-4 pr-28 pl-3"
                  suppressHydrationWarning
                >
                  <span
                    suppressHydrationWarning
                    className={
                      isHydrated
                        ? "typewriter-text text-muted-foreground text-base md:text-sm"
                        : "text-muted-foreground text-base opacity-0 md:text-sm"
                    }
                    style={
                      isHydrated
                        ? {
                            animation: `typewriter ${Math.min(greeting.length * 0.06, 2.5)}s steps(${greeting.length}) forwards`,
                          }
                        : undefined
                    }
                  >
                    {greeting}
                  </span>
                </div>
              )}
              {!noteText && hasContent && !isStreaming && (
                <div className="pointer-events-none absolute inset-0 flex items-start pt-4 pr-28 pl-3">
                  <span className="text-muted-foreground text-base md:text-sm">
                    Ask a follow-up question...
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

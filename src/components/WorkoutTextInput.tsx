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
import { Dumbbell, Plus, Save, Square } from "lucide-react";
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
import { saveWorkoutProgramAction } from "@/actions/workout-program";
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
import { PROGRAM_CREATED_MARKER } from "@/lib/workout-program-system-prompt";
import type { AthleteProfileForPrompt } from "@/lib/workout-program-system-prompt";
import {
  consumeChatSseBody,
  sseSnapshotToBubblePatch,
} from "@/lib/chat-sse-client";

const WORKOUT_PRE_CREATE_NOTE_ID_KEY = "otium.workout.preCreateNoteId";

const SAVE_KEYWORDS = ["save", "yes", "ok", "sure", "go ahead", "please save", "save it", "save the program"];

function isSaveIntent(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return lower.length < 60 && SAVE_KEYWORDS.some((k) => lower.includes(k));
}

function extractProgramTitle(content: string): string {
  const headingMatch = content.match(/^#{1,3}\s+(.+)/m);
  if (headingMatch?.[1]) return headingMatch[1].trim();
  const boldMatch = content.match(/\*\*(.+?)\*\*/);
  if (boldMatch?.[1]) return boldMatch[1].trim();
  return "My Workout Program";
}

type Props = {
  noteId: string;
  startingNoteText: string;
  startingChatMessages?: NoteLike[];
  user: User | null;
  feedNotes?: NoteLike[];
  greeting?: string;
  welcomeMessage?: string;
  athleteProfile?: AthleteProfileForPrompt | null;
};

export default function WorkoutTextInput({
  noteId,
  startingNoteText,
  startingChatMessages = [],
  user,
  feedNotes = [],
  greeting = "What's on your mind?",
  welcomeMessage,
  athleteProfile,
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

  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const [hasTyped, setHasTyped] = useState(false);
  const [chatMessages, setChatMessages] = useState<NoteLike[]>([]);
  const authScope = user?.id ?? "guest";
  const chatStorageKey = `chat-workout-${authScope}-${noteId}`;
  const [currentNoteId, setCurrentNoteId] = useState(noteId);
  const previousAuthScopeRef = useRef(authScope);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);

  // Workout program creation state
  const [workoutProgramGenerated, setWorkoutProgramGenerated] = useState(false);
  const [pendingProgramContent, setPendingProgramContent] = useState("");
  const [isSavingProgram, setIsSavingProgram] = useState(false);

  const workoutProfileEditor = useOptionalWorkoutProfileEditor();
  const { Icon: WorkoutProgramProfileIcon } = getWorkoutProgramLogoDefinition(
    workoutProfileEditor?.workoutProgramLogoId,
  );
  const [workoutProgramComposerActive, setWorkoutProgramComposerActive] =
    useState(false);
  const [workoutAddIconRotating, setWorkoutAddIconRotating] = useState(false);
  const [workoutAddMenuOpen, setWorkoutAddMenuOpen] = useState(false);
  const [workoutAddTriggerHovered, setWorkoutAddTriggerHovered] =
    useState(false);

  useEffect(() => {
    if (!workoutProgramComposerActive) {
      setWorkoutAddTriggerHovered(false);
    }
  }, [workoutProgramComposerActive]);

  const userNotes: NoteLike[] = user
    ? feedNotes
    : (guestNotes.filter((n) => n.id === noteId) as NoteLike[]);

  const hasUserNoteContent = useMemo(() => {
    return userNotes.length > 0 && userNotes[0]?.text?.trim().length > 0;
  }, [userNotes]);

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
          sessionStorage.setItem(chatStorageKey, serialized);
        }
      } catch (error) {
        console.error("Failed to save chat messages to sessionStorage:", error);
      }
    }
  }, [chatMessages, chatStorageKey, currentNoteId, noteId]);

  // Persist full workout chat history to DB for authenticated users
  useEffect(() => {
    if (!user || isStreaming || currentNoteId !== noteId || chatMessages.length === 0) {
      return;
    }

    const messagesToPersist = chatMessages
      .filter((m) => !m.isLoading && m.text?.trim())
      .map((m) => ({
        id: m.id,
        text: m.text.trim(),
        createdAt: new Date(m.createdAt).toISOString(),
        isAI: m.isAI === true,
      }));

    if (messagesToPersist.length === 0) return;

    const firstUserMessage =
      messagesToPersist.find((m) => !m.isAI)?.text ?? startingNoteText.trim();

    if (!firstUserMessage) return;

    const timeout = setTimeout(() => {
      void updateWorkoutAction(noteId, firstUserMessage, messagesToPersist);
    }, 500);

    return () => clearTimeout(timeout);
  }, [
    user,
    isStreaming,
    currentNoteId,
    noteId,
    chatMessages,
    startingNoteText,
  ]);

  useEffect(() => {
    if (previousAuthScopeRef.current !== authScope) {
      previousAuthScopeRef.current = authScope;
      setChatMessages([]);
      setHasTyped(false);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsStreaming(false);
      streamingMessageIdRef.current = null;
    }

    if (currentNoteId !== noteId) {
      setChatMessages([]);
      setCurrentNoteId(noteId);
      setHasTyped(false);
      setWorkoutProgramGenerated(false);
      setPendingProgramContent("");

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsStreaming(false);

      if (typeof window !== "undefined") {
        try {
          const stored = sessionStorage.getItem(chatStorageKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.length > 0) setChatMessages(parsed);
          } else if (startingChatMessages.length > 0) {
            setChatMessages(startingChatMessages);
          }
        } catch (error) {
          console.error("Failed to reload chat messages:", error);
          if (startingChatMessages.length > 0) {
            setChatMessages(startingChatMessages);
          }
        }
      }
    } else if (typeof window !== "undefined") {
      if (chatMessages.length === 0) {
        try {
          const stored = sessionStorage.getItem(chatStorageKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.length > 0) setChatMessages(parsed);
          } else if (startingChatMessages.length > 0) {
            setChatMessages(startingChatMessages);
          }
        } catch (error) {
          console.error("Failed to reload chat messages:", error);
          if (startingChatMessages.length > 0) {
            setChatMessages(startingChatMessages);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authScope, chatStorageKey, noteId, currentNoteId, startingChatMessages]);

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

  // ---------- Save workout program ----------
  const handleSaveProgram = useCallback(
    async (content: string, userText?: string) => {
      if (!athleteProfile) return;

      setIsSavingProgram(true);

      // Add user's save message to chat
      if (userText) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `user-msg-${Date.now()}`,
            text: userText,
            createdAt: new Date(),
            isAI: false,
          },
        ]);
      }
      setNoteText("");

      // Show loading bubble
      const aiMessageId = `ai-save-${Date.now()}`;
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

      const title = extractProgramTitle(content);
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + athleteProfile.timelineWeeks * 7);

      const result = await saveWorkoutProgramAction({
        title,
        content,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      setIsSavingProgram(false);

      if (result.errorMessage) {
        setChatMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId
              ? {
                  ...m,
                  isLoading: false,
                  text: `❌ Failed to save: ${result.errorMessage}`,
                }
              : m,
          ),
        );
        return;
      }

      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === aiMessageId
            ? {
                ...m,
                isLoading: false,
                text: `✅ **Workout program saved!** Redirecting to your program page...`,
              }
            : m,
        ),
      );

      setWorkoutProgramGenerated(false);
      setPendingProgramContent("");

      setTimeout(() => {
        router.push("/workout/program");
      }, 1500);
    },
    [athleteProfile, router],
  );

  // ---------- Streaming AI response ----------
  const streamAIResponse = useCallback(
    async (userMessage: string) => {
      const aiMessageId = `ai-stream-${Date.now()}`;
      streamingMessageIdRef.current = aiMessageId;

      setChatMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
          text: "",
          createdAt: new Date(),
          isAI: true,
          isLoading: true,
          streamUserPrompt: userMessage,
          streamStartedAt: new Date().toISOString(),
        },
      ]);

      const conversationHistory = chatMessages
        .filter((m) => m.text?.trim() && !m.isLoading)
        .map((m) => ({
          role: m.isAI ? ("assistant" as const) : ("user" as const),
          content: m.text,
        }));

      if (hasUserNoteContent && userNotes[0]?.text?.trim()) {
        conversationHistory.unshift({
          role: "user" as const,
          content: userNotes[0].text,
        });
      }

      const messages = [
        ...conversationHistory,
        { role: "user" as const, content: userMessage },
      ];

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsStreaming(true);

      // Use workout-program prompt type when composer is active and athlete profile exists
      const promptType =
        workoutProgramComposerActive && athleteProfile
          ? "workout-program"
          : "workout";

      const answerAccumulator = { current: "" };

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages,
            promptType,
            athleteProfile:
              promptType === "workout-program" ? athleteProfile : undefined,
            streamFormat: "sse",
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error("Failed to get streaming response");
        }

        const reader = response.body.getReader();
        answerAccumulator.current = "";

        setChatMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId ? { ...m, isLoading: false, text: "" } : m,
          ),
        );

        let shouldFallbackAfterSseError = false;

        try {
          await consumeChatSseBody(reader, {
            throttleMs: 50,
            onSnapshot: (snap) => {
              answerAccumulator.current = snap.answer;
              const patch = sseSnapshotToBubblePatch(snap);
              if (patch === null) {
                setChatMessages((prev) =>
                  prev.filter((m) => m.id !== aiMessageId),
                );
                if (
                  snap.terminal === "failed" &&
                  snap.failureCode !== "aborted"
                ) {
                  shouldFallbackAfterSseError = true;
                }
                return;
              }
              setChatMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMessageId ? { ...m, ...patch } : m,
                ),
              );

              if (
                snap.terminal === "completed" &&
                workoutProgramComposerActive &&
                snap.answer.includes(PROGRAM_CREATED_MARKER)
              ) {
                setWorkoutProgramGenerated(true);
                setPendingProgramContent(snap.answer.trim());
              }
            },
          });
        } catch (readErr: unknown) {
          if (
            readErr instanceof DOMException &&
            readErr.name === "AbortError"
          ) {
            const t = answerAccumulator.current.trim();
            setChatMessages((prev) =>
              prev.map((m) =>
                m.id === aiMessageId
                  ? {
                      ...m,
                      isLoading: false,
                      text: t || m.text,
                      streamStatusLabel: undefined,
                      streamSteps: undefined,
                      streamActivityLines: undefined,
                      streamError: undefined,
                      streamTerminal: undefined,
                      streamUserPrompt: undefined,
                      streamStartedAt: undefined,
                      streamEndedAt: undefined,
                    }
                  : m,
              ),
            );
          } else {
            throw readErr;
          }
        }

        if (shouldFallbackAfterSseError) {
          await fallbackNonStreaming();
        }
      } catch (error: unknown) {
        const isAbort =
          (error instanceof DOMException && error.name === "AbortError") ||
          (error instanceof Error && error.name === "AbortError");
        if (isAbort) {
          setChatMessages((prev) =>
            prev.map((m) =>
              m.id === aiMessageId
                ? {
                    ...m,
                    isLoading: false,
                    streamStatusLabel: undefined,
                    streamSteps: undefined,
                    streamActivityLines: undefined,
                    streamError: undefined,
                    streamTerminal: undefined,
                    streamUserPrompt: undefined,
                    streamStartedAt: undefined,
                    streamEndedAt: undefined,
                  }
                : m,
            ),
          );
        } else {
          console.error("Streaming error:", error);
          setChatMessages((prev) => prev.filter((m) => m.id !== aiMessageId));
          await fallbackNonStreaming();
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
        streamingMessageIdRef.current = null;

        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, 100);
      }
    },
    [chatMessages, hasUserNoteContent, userNotes, workoutProgramComposerActive, athleteProfile],
  );

  const fallbackNonStreaming = async () => {
    setChatMessages((prev) => [
      ...prev,
      {
        id: `ai-error-${Date.now()}`,
        text: "I couldn't generate a response right now. Try again, or add your goal, available time, and any equipment you have.",
        createdAt: new Date(),
        isAI: true,
      },
    ]);
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // ---------- Send ----------
  const sendNote = async () => {
    const textToSave = noteText.trim();
    if (!textToSave) return;

    // Intercept save intent when a program has been generated
    if (workoutProgramGenerated && isSaveIntent(textToSave) && athleteProfile) {
      await handleSaveProgram(pendingProgramContent, textToSave);
      return;
    }

    const isFirstMessage = !hasContent;

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

    setNoteText("");

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

    const shell = document.getElementById("shell");
    shell?.classList.remove("justify-center");
    shell?.classList.add("justify-start");

    if (user && isFirstMessage) {
      router.refresh();
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
    }

    await streamAIResponse(textToSave);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.key === "Enter" || e.keyCode === 13) && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      await sendNote();
    }
  };

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
    router.push(`/workout?noteId=${newId}`);
    window.setTimeout(() => {
      setWorkoutAddIconRotating(false);
    }, 600);
  }, [router, noteId]);

  const handleCancelWorkoutProgram = useCallback(async () => {
    setWorkoutAddTriggerHovered(false);
    setWorkoutProgramComposerActive(false);
    setWorkoutAddMenuOpen(false);
    setWorkoutProgramGenerated(false);
    setPendingProgramContent("");

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

  const addMenuComposerActiveClassName = cn(
    addMenuButtonClassName,
    "shadow-none hover:shadow-none hover:!shadow-none",
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

  // Suppress unused ref warning
  void updateTimeoutRef;

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

      {/* Save program banner — shown when a program has been generated */}
      {workoutProgramGenerated && !isSavingProgram && (
        <div className="relative flex w-full items-center px-3.5 pb-0 pt-2">
          <div className="flex w-full items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-950/40">
            <span className="text-xs text-green-700 dark:text-green-300 flex-1">
              Program ready — type <strong>save</strong> to save, or ask for changes.
            </span>
            <Button
              size="sm"
              disabled={isStreaming}
              className="h-7 gap-1.5 bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
              onClick={() =>
                handleSaveProgram(pendingProgramContent)
              }
            >
              <Save className="h-3.5 w-3.5" />
              Save Program
            </Button>
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="relative flex w-full items-center px-3.5 py-2.5">
        <div className="relative flex w-full max-w-4xl flex-col rounded-2xl border bg-white shadow dark:bg-gray-900">
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
                disabled={isStreaming || isSavingProgram}
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
                      disabled={!noteText.trim() || isSavingProgram}
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
                    {workoutProgramGenerated
                      ? 'Type "save" to save your program, or ask for changes...'
                      : "Ask a follow-up question..."}
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

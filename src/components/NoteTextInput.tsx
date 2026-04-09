"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { NOTE_PERSISTED_EVENT } from "@/components/nav-actions";
import { User } from "@supabase/supabase-js";
import { Square } from "lucide-react";

import { Textarea } from "./ui/textarea";
import NewNoteButton from "./NewNoteButton";
import NotesFeed, { NoteLike } from "./NotesFeed";

import useNote from "@/hooks/useNote";
import { GuestNote } from "@/providers/NoteProvider";
import { updateNoteAction, createNoteAction } from "@/actions/notes";
//import { generateNoteTitle } from "@/actions/generate-title";
import { generateNoteGreeting } from "@/actions/generate-greeting";
import MicrophoneButton from "./MicrophoneButton";
import AskAIButton from "./AskAIButton";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  noteId: string;
  startingNoteText: string;
  startingChatMessages?: NoteLike[];
  user: User | null;
  feedNotes?: NoteLike[];
  greeting?: string;
  showOtiumLogo?: boolean;
};

export default function NoteTextInput({
  noteId,
  startingNoteText,
  startingChatMessages = [],
  user,
  feedNotes = [],
  greeting = "What's on your mind?",
  showOtiumLogo = false,
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

  // Are we editing the existing note content?
  const [isEditing, setIsEditing] = useState(false);

  // Prevent typewriter animation from running during SSR/hydration
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Track if user has typed - prevent typewriter from showing again after clearing
  const [hasTyped, setHasTyped] = useState(false);

  // Store local conversation messages for this note.
  const [aiGreetings, setAiGreetings] = useState<NoteLike[]>([]);

  // Track the current noteId to detect when it changes
  const [currentNoteId, setCurrentNoteId] = useState(noteId);
  const [isGeneratingGreeting, setIsGeneratingGreeting] = useState(false);
  const activeGreetingRequestIdRef = useRef<string | null>(null);
  const activeLoadingBubbleIdRef = useRef<string | null>(null);

  // Streaming state for follow-up messages
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);

  // Feed scoped to this noteId only - combine user notes and AI greetings
  const userNotes: NoteLike[] = user
    ? feedNotes
    : (guestNotes.filter((n) => n.id === noteId) as NoteLike[]);

  // Check if there's user note content (not including greetings)
  // This must be defined before useEffect hooks that use it
  const hasUserNoteContent = useMemo(() => {
    return userNotes.length > 0 && userNotes[0]?.text?.trim().length > 0;
  }, [userNotes]);

  // Save local conversation messages to sessionStorage whenever they change.
  // Save all messages (user + AI) to prevent losing follow-up conversations.
  // Only save for the current note to prevent cross-contamination.
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      aiGreetings.length > 0 &&
      currentNoteId === noteId
    ) {
      try {
        // Persist completed messages only (exclude loading placeholders).
        // Include both user messages and AI responses.
        const messagesToSave = aiGreetings.filter(
          (m) => !m.isLoading && m.text,
        );
        if (messagesToSave.length > 0) {
          const serialized = JSON.stringify(messagesToSave);
          sessionStorage.setItem(`ai-greetings-${noteId}`, serialized);
        }
      } catch (error) {
        console.error("Failed to save AI greetings to sessionStorage:", error);
      }
    }
  }, [aiGreetings, noteId, currentNoteId]);

  // Persist full chat history to DB for authenticated users
  useEffect(() => {
    if (
      !user ||
      isStreaming ||
      isGeneratingGreeting ||
      currentNoteId !== noteId ||
      aiGreetings.length === 0
    ) {
      return;
    }

    const messagesToPersist = aiGreetings
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
      void updateNoteAction(noteId, firstUserMessage, messagesToPersist);
    }, 500);

    return () => clearTimeout(timeout);
  }, [
    user,
    isStreaming,
    isGeneratingGreeting,
    currentNoteId,
    noteId,
    aiGreetings,
    startingNoteText,
  ]);

  // Handle noteId changes and load appropriate greetings
  useEffect(() => {
    // Check if we've switched to a different note
    if (currentNoteId !== noteId) {
      // Clear current greetings when switching notes
      setAiGreetings([]);
      setCurrentNoteId(noteId);
      setIsEditing(false);
      setHasTyped(false);
      setIsGeneratingGreeting(false);
      activeGreetingRequestIdRef.current = null;
      activeLoadingBubbleIdRef.current = null;

      // Stop any ongoing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsStreaming(false);
      streamingMessageIdRef.current = null;

      // Load messages for the new note from sessionStorage
      if (typeof window !== "undefined") {
        try {
          const stored = sessionStorage.getItem(`ai-greetings-${noteId}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.length > 0) {
              setAiGreetings(parsed);
            }
          } else if (startingChatMessages.length > 0) {
            setAiGreetings(startingChatMessages);
          }
        } catch (error) {
          console.error(
            "Failed to reload AI greetings from sessionStorage:",
            error,
          );
          if (startingChatMessages.length > 0) {
            setAiGreetings(startingChatMessages);
          }
        }
      }
    } else if (typeof window !== "undefined") {
      // Same note - load messages if not already loaded
      if (aiGreetings.length === 0) {
        try {
          const stored = sessionStorage.getItem(`ai-greetings-${noteId}`);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.length > 0) {
              setAiGreetings(parsed);
            }
          } else if (startingChatMessages.length > 0) {
            setAiGreetings(startingChatMessages);
          }
        } catch (error) {
          console.error(
            "Failed to reload AI greetings from sessionStorage:",
            error,
          );
          if (startingChatMessages.length > 0) {
            setAiGreetings(startingChatMessages);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, hasUserNoteContent, currentNoteId, startingChatMessages]);

  // Combine persisted user note + local AI/user transient messages, sorted by creation time.
  // Avoid showing the same user note twice once we have a local optimistic user bubble.
  const feed: NoteLike[] = useMemo(() => {
    const optimisticUserTexts = new Set(
      aiGreetings
        .filter((n) => !n.isAI && n.text?.trim())
        .map((n) => n.text.trim()),
    );
    const filteredUserNotes = userNotes.filter(
      (n) => !optimisticUserTexts.has(n.text?.trim() ?? ""),
    );
    const combined = [...filteredUserNotes, ...aiGreetings];
    return combined.sort(
      (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt),
    );
  }, [userNotes, aiGreetings]);
  const hasContent = useMemo(
    () => feed.some((n) => n.isLoading || (n.text && n.text.trim().length > 0)),
    [feed],
  );

  // Hydrate composer on first load / when URL matches
  useEffect(() => {
    if (
      noteIdParam === noteId &&
      !hasTyped &&
      !noteText &&
      !hasContent &&
      aiGreetings.length === 0
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
    aiGreetings.length,
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
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [noteText]);

  // ---------- Helpers ----------
  const upsertGuestNote = async (text: string) => {
    const existing = guestNotes.find((n) => n.id === noteId);

    // Generate title if note has substantial content
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

  // Only autosave while EDITING.
  const scheduleSave = (text: string) => {
    if (!isEditing) return; // â† important: do NOT touch the saved note while composing a new one
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(async () => {
      if (!user) await upsertGuestNote(text);
      else updateNoteAction(noteId, text);
    }, 1200);
  };

  const flushSaveNow = async (text: string) => {
    if (!isEditing) return; // safety: only flush when editing
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    if (!user) {
      await upsertGuestNote(text);
      return null;
    }
    const res = await updateNoteAction(noteId, text);
    if (res?.errorMessage) {
      const created = await createNoteAction(noteId);
      if (!created?.errorMessage) {
        const updateRes = await updateNoteAction(noteId, text);
        return updateRes;
      }
      return null;
    }
    return res;
  };

  const handleUpdateNote = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNoteText(text);
    scheduleSave(text);
    // Mark that user has typed - prevents typewriter from showing again
    if (!hasTyped && text.length > 0) {
      setHasTyped(true);
    }
  };

  const generateGreetingWithLoading = async (textToSave: string) => {
    const requestId = `ai-greeting-request-${Date.now()}`;
    const loadingId = `ai-greeting-loading-${Date.now()}`;
    activeGreetingRequestIdRef.current = requestId;
    activeLoadingBubbleIdRef.current = loadingId;
    setIsGeneratingGreeting(true);

    const loadingNote: NoteLike = {
      id: loadingId,
      text: "",
      createdAt: new Date(),
      isAI: true,
      isLoading: true,
    };
    setAiGreetings((prev) => [...prev, loadingNote]);

    try {
      const userLocalHour = new Date().getHours();
      const greeting = await generateNoteGreeting(textToSave, userLocalHour);

      // If user cancelled or a newer request started, keep state untouched.
      if (activeGreetingRequestIdRef.current !== requestId) {
        return;
      }

      setAiGreetings((prev) => {
        const filtered = prev.filter((n) => n.id !== loadingId);
        if (!greeting) return filtered;
        return [
          ...filtered,
          {
            id: `ai-greeting-${Date.now()}`,
            text: greeting,
            createdAt: new Date(),
            isAI: true,
          },
        ];
      });
    } catch (error) {
      if (activeGreetingRequestIdRef.current === requestId) {
        console.error("Error generating greeting:", error);
        setAiGreetings((prev) => prev.filter((n) => n.id !== loadingId));
      }
    } finally {
      if (activeGreetingRequestIdRef.current === requestId) {
        activeGreetingRequestIdRef.current = null;
        activeLoadingBubbleIdRef.current = null;
        setIsGeneratingGreeting(false);
      }
    }
  };

  const handleStopGenerating = () => {
    // Stop greeting generation
    activeGreetingRequestIdRef.current = null;
    setIsGeneratingGreeting(false);
    const loadingId = activeLoadingBubbleIdRef.current;
    if (loadingId) {
      setAiGreetings((prev) => prev.filter((n) => n.id !== loadingId));
    }
    activeLoadingBubbleIdRef.current = null;

    // Stop streaming
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // ---------- Streaming AI response for follow-up messages ----------
  const streamAIResponse = async (userMessage: string) => {
    const aiMessageId = `ai-stream-${Date.now()}`;
    streamingMessageIdRef.current = aiMessageId;

    // Add loading bubble
    setAiGreetings((prev) => [
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
    const conversationHistory = aiGreetings
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
        body: JSON.stringify({ messages, promptType: "otium" }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to get streaming response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      // Replace loading with empty streaming bubble
      setAiGreetings((prev) =>
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
        setAiGreetings((prev) =>
          prev.map((m) =>
            m.id === aiMessageId ? { ...m, text: accumulated } : m,
          ),
        );
      }

      // Final update
      if (accumulated.trim()) {
        setAiGreetings((prev) =>
          prev.map((m) =>
            m.id === aiMessageId
              ? { ...m, text: accumulated.trim(), isLoading: false }
              : m,
          ),
        );
      } else {
        // If no text was received, remove the bubble
        setAiGreetings((prev) => prev.filter((m) => m.id !== aiMessageId));
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        // User stopped the stream — keep whatever was accumulated
        setAiGreetings((prev) =>
          prev.map((m) =>
            m.id === aiMessageId ? { ...m, isLoading: false } : m,
          ),
        );
      } else {
        console.error("Streaming error:", error);
        // Remove loading bubble on error
        setAiGreetings((prev) => prev.filter((m) => m.id !== aiMessageId));
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
  };

  // ---------- Send ----------
  // Behavior:
  // - If editing: save edits to the SAME note.
  // - If not editing: persist only the first note message; follow-ups stay in local chat flow.
  const sendNote = async () => {
    const textToSave = noteText.trim();
    if (!textToSave) return;
    if (isGeneratingGreeting) return;
    let shouldGenerateGreeting = false;
    const isFirstMessage = !hasUserNoteContent;

    // Match Neuroplasticity UX: always append user's sent message immediately.
    if (!isEditing) {
      setAiGreetings((prev) => [
        ...prev,
        {
          id: `user-msg-${Date.now()}`,
          text: textToSave,
          createdAt: new Date(),
          isAI: false,
        },
      ]);
    }

    // Clear text immediately
    setNoteText("");

    if (isEditing) {
      const res = await flushSaveNow(textToSave);
      setIsEditing(false);
      toast.success("Note updated successfully");

      // Generate greeting in the background after save completes
      if (res && !res.errorMessage) {
        shouldGenerateGreeting = true;
      }
    } else {
      // Persist only the first note content.
      if (isFirstMessage) {
        if (!user) {
          await upsertGuestNote(textToSave);

          // Show guest login prompt
          toast.info("Please log in or sign up to save your notes", {
            duration: 5000,
            action: {
              label: "Log in",
              onClick: () => router.push("/login"),
            },
          });
        } else {
          const res = await updateNoteAction(noteId, textToSave);
          if (res?.errorMessage) {
            const created = await createNoteAction(noteId);
            if (!created?.errorMessage) {
              const updateRes = await updateNoteAction(noteId, textToSave);
              toast.success("Note created successfully");
              // Check if this is the first note of the day
              if (updateRes?.isFirstNoteOfDay && user) {
                window.dispatchEvent(new CustomEvent("firstDailyNoteSaved"));
              }
              window.dispatchEvent(
                new CustomEvent(NOTE_PERSISTED_EVENT, {
                  detail: { noteId },
                }),
              );
            } else {
              toast.error("Failed to create note");
              return; // Don't proceed with clearing if failed
            }
          } else {
            toast.success("Note saved successfully");
            // Check if this is the first note of the day
            if (res?.isFirstNoteOfDay && user) {
              window.dispatchEvent(new CustomEvent("firstDailyNoteSaved"));
            }
            window.dispatchEvent(
              new CustomEvent(NOTE_PERSISTED_EVENT, {
                detail: { noteId },
              }),
            );
          }
        }
      }

      // For first message: use greeting generation (non-streaming)
      // For follow-up messages: use streaming chat (typewriter effect)
      if (isFirstMessage) {
        shouldGenerateGreeting = true;
      } else {
        // Use streaming for follow-up messages to get typewriter effect
        await streamAIResponse(textToSave);
      }
    }

    const shell = document.getElementById("shell");
    shell?.classList.remove("justify-center");
    shell?.classList.add("justify-start");

    // Refresh sidebar only when the persisted note was created/updated.
    if (user && (isEditing || isFirstMessage)) {
      router.refresh();
    }

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
    }

    if (shouldGenerateGreeting) {
      void generateGreetingWithLoading(textToSave);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.key === "Enter" || e.keyCode === 13) && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      await sendNote();
    }
  };

  // Speech + Ask AI integrate with the local composer text only
  const handleSpeechTranscript = (transcript: string) => {
    const newText = noteText ? `${noteText} ${transcript}` : transcript;
    setNoteText(newText);

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
    // Enter explicit edit mode: load existing note into composer and show it
    setNoteText(text);
    setIsEditing(true);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const len = text.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(len, len);
      }
    });
  };

  return (
    <div
      className={`relative mx-auto flex h-full w-full max-w-3xl flex-1 min-h-0 flex-col ${
        hasContent ? "" : "justify-center"
      }`}
    >
      {/* Bubble (your UI untouched) */}
      {hasContent && (
        <div className="flex-1 min-h-0 overflow-y-auto pb-28">
          <NotesFeed notes={feed} onCopy={handleCopy} onEdit={handleEdit} />
        </div>
      )}

      {/* Composer - always visible for follow-up notes */}
      <div className="sticky bottom-0 z-10 flex w-full items-end bg-background px-3.5 py-2.5">
        {showOtiumLogo && !hasContent && (
          <div className="pointer-events-none absolute bottom-full left-1/2 mb-6 -translate-x-1/2">
            <Image
              src="/otium_gray.ico"
              alt="Otium Logo"
              width={120}
              height={120}
              className="opacity-30"
            />
          </div>
        )}
        <div className="relative flex w-full max-w-4xl flex-col rounded-2xl border bg-white shadow dark:bg-gray-900">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={noteText}
              onChange={handleUpdateNote}
              onKeyDown={handleKeyDown}
              placeholder=""
              disabled={isGeneratingGreeting || isStreaming}
              className="custom-scrollbar field-sizing-fixed flex-1 resize-none rounded-2xl border-0 bg-transparent pl-4 pr-28 py-4 shadow-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
              rows={1}
              style={{ minHeight: 48 }}
            />
            {/* Buttons absolutely positioned on the right side */}
            <div className="absolute bottom-2.5 right-2 flex items-center gap-1.5">
              {isGeneratingGreeting || isStreaming ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleStopGenerating}
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
                  <AskAIButton user={user} noteText={noteText} />
                  <NewNoteButton
                    user={user}
                    onSend={sendNote}
                    disabled={!noteText.trim()}
                  />
                </>
              )}
            </div>
            {/* Typewriter placeholder - shows only on initial load, not after user has typed */}
            {!noteText && !isEditing && !hasTyped && !hasContent && (
              <div
                className="pointer-events-none absolute inset-0 flex items-start pl-4 pr-28 pt-4"
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
            {/* Follow-up placeholder */}
            {!noteText && !isEditing && hasContent && !isGeneratingGreeting && !isStreaming && (
              <div className="pointer-events-none absolute inset-0 flex items-start pl-4 pr-28 pt-4">
                <span className="text-muted-foreground text-base md:text-sm">
                  Ask a follow-up question...
                </span>
              </div>
            )}
            {/* Static placeholder for editing mode */}
            {!noteText && isEditing && (
              <div className="pointer-events-none absolute inset-0 flex items-start pl-4 pr-28 pt-4">
                <span className="text-muted-foreground text-base md:text-sm">
                  Edit your note
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

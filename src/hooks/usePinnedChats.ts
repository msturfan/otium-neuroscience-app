"use client";

import { useCallback, useEffect, useState } from "react";

export const PINNED_CHATS_CHANGED_EVENT = "otium-pinned-chats-changed";

export type PinnedChatContext = "otium" | "neuroscience" | "workout";

const KEY_OTIUM = "otium.pinnedNoteIds";
const KEY_NEURO = "otium.pinnedNeuroscienceNoteIds";
const KEY_WORKOUT = "otium.pinnedWorkoutNoteIds";

function storageKey(context: PinnedChatContext) {
  if (context === "neuroscience") return KEY_NEURO;
  if (context === "workout") return KEY_WORKOUT;
  return KEY_OTIUM;
}

export function readPinnedIds(context: PinnedChatContext): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(context));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

export function writePinnedIds(context: PinnedChatContext, ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(context), JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(PINNED_CHATS_CHANGED_EVENT));
}

export function usePinnedChats(context: PinnedChatContext) {
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  useEffect(() => {
    setPinnedIds(readPinnedIds(context));
  }, [context]);

  useEffect(() => {
    const sync = () => setPinnedIds(readPinnedIds(context));
    window.addEventListener(PINNED_CHATS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(PINNED_CHATS_CHANGED_EVENT, sync);
  }, [context]);

  const togglePin = useCallback(
    (noteId: string) => {
      const current = readPinnedIds(context);
      const idx = current.indexOf(noteId);
      const next =
        idx === -1 ? [noteId, ...current] : current.filter((id) => id !== noteId);
      writePinnedIds(context, next);
      setPinnedIds(next);
    },
    [context],
  );

  const isPinned = useCallback(
    (noteId: string) => pinnedIds.includes(noteId),
    [pinnedIds],
  );

  return { pinnedIds, togglePin, isPinned };
}

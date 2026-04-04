"use client";

import { useCallback, useEffect, useState } from "react";

export const PINNED_CHATS_CHANGED_EVENT = "otium-pinned-chats-changed";

const KEY_OTIUM = "otium.pinnedNoteIds";
const KEY_NEURO = "otium.pinnedNeuroscienceNoteIds";

function storageKey(isNeuroscience: boolean) {
  return isNeuroscience ? KEY_NEURO : KEY_OTIUM;
}

export function readPinnedIds(isNeuroscience: boolean): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(isNeuroscience));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

export function writePinnedIds(isNeuroscience: boolean, ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(isNeuroscience), JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(PINNED_CHATS_CHANGED_EVENT));
}

export function usePinnedChats(isNeuroscience: boolean) {
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  useEffect(() => {
    setPinnedIds(readPinnedIds(isNeuroscience));
  }, [isNeuroscience]);

  useEffect(() => {
    const sync = () => setPinnedIds(readPinnedIds(isNeuroscience));
    window.addEventListener(PINNED_CHATS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(PINNED_CHATS_CHANGED_EVENT, sync);
  }, [isNeuroscience]);

  const togglePin = useCallback(
    (noteId: string) => {
      const current = readPinnedIds(isNeuroscience);
      const idx = current.indexOf(noteId);
      const next =
        idx === -1 ? [noteId, ...current] : current.filter((id) => id !== noteId);
      writePinnedIds(isNeuroscience, next);
      setPinnedIds(next);
    },
    [isNeuroscience],
  );

  const isPinned = useCallback(
    (noteId: string) => pinnedIds.includes(noteId),
    [pinnedIds],
  );

  return { pinnedIds, togglePin, isPinned };
}

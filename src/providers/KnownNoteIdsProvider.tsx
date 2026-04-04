"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type KnownNoteIdsContextValue = {
  knownNoteIds: Set<string> | null;
  setKnownNoteIds: (ids: Set<string> | null) => void;
};

const KnownNoteIdsContext = createContext<KnownNoteIdsContextValue | null>(
  null,
);

export function KnownNoteIdsProvider({ children }: { children: ReactNode }) {
  const [knownNoteIds, setKnownNoteIds] = useState<Set<string> | null>(null);
  return (
    <KnownNoteIdsContext.Provider
      value={{ knownNoteIds, setKnownNoteIds }}
    >
      {children}
    </KnownNoteIdsContext.Provider>
  );
}

/** Safe outside a provider: sidebar IDs stay unknown until `NavNotes` loads. */
export function useKnownNoteIds(): KnownNoteIdsContextValue {
  const ctx = useContext(KnownNoteIdsContext);
  if (!ctx) {
    return { knownNoteIds: null, setKnownNoteIds: () => {} };
  }
  return ctx;
}

"use client";

import { createContext, useState, useEffect } from "react";

export type GuestNote = {
  id: string;
  text: string;
  createdAt: Date;
};

type NoteProviderContextType = {
  noteText: string;
  setNoteText: (noteText: string) => void;
  guestNotes: GuestNote[];
  addGuestNote: (note: GuestNote) => void;
  updateGuestNote: (id: string, text: string) => void;
  deleteGuestNote: (id: string) => void;
  clearGuestNotes: () => void;
};

export const NoteProviderContext = createContext<NoteProviderContextType>({
  noteText: "",
  setNoteText: () => {},
  guestNotes: [],
  addGuestNote: () => {},
  updateGuestNote: () => {},
  deleteGuestNote: () => {},
  clearGuestNotes: () => {},
});

function NoteProvider({ children }: { children: React.ReactNode }) {
  const [noteText, setNoteText] = useState("");
  const [guestNotes, setGuestNotes] = useState<GuestNote[]>([]);

  // Load guest notes from localStorage on mount
  useEffect(() => {
    const storedNotes = localStorage.getItem("guestNotes");
    if (storedNotes) {
      setGuestNotes(JSON.parse(storedNotes));
    }
  }, []);

  // Save guest notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("guestNotes", JSON.stringify(guestNotes));
  }, [guestNotes]);

  const addGuestNote = (note: GuestNote) => {
    setGuestNotes((prev) => [note, ...prev]);
  };

  const updateGuestNote = (id: string, text: string) => {
    setGuestNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, text } : note)),
    );
  };

  const deleteGuestNote = (id: string) => {
    setGuestNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const clearGuestNotes = () => {
    setGuestNotes([]);
    localStorage.removeItem("guestNotes");
  };

  return (
    <NoteProviderContext.Provider
      value={{
        noteText,
        setNoteText,
        guestNotes,
        addGuestNote,
        updateGuestNote,
        deleteGuestNote,
        clearGuestNotes,
      }}
    >
      {children}
    </NoteProviderContext.Provider>
  );
}

export default NoteProvider;

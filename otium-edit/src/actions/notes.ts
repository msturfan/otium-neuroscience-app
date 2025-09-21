"use server";

import { getUser } from "@/auth/server";
import { prisma } from "@/db/prisma";
import { handleError } from "@/lib/utils";

export async function createNoteAction(id?: string) {
  const user = await getUser();
  if (!user) return { errorMessage: "Not signed in" };

  const noteId = id ?? crypto.randomUUID();

  try {
    await prisma.note.create({
      data: { id: noteId, authorId: user.id, text: "" },
    });
    return { id: noteId };
  } catch (e) {
    // If it already exists, treat as success
    return { id: noteId };
  }
}

// Idempotent: update text; if the note doesn't exist yet, create it with that text.
export async function updateNoteAction(id: string, text: string) {
  const user = await getUser();
  if (!user) return { errorMessage: "Not signed in" };

  try {
    const result = await prisma.note.updateMany({
      where: { id, authorId: user.id },
      data: { text },
    });

    if (result.count === 0) {
      await prisma.note.create({
        data: { id, authorId: user.id, text },
      });
    }
    return { id };
  } catch (e) {
    return { errorMessage: "DB error" };
  }
}

export const deleteNoteAction = async (noteId: string) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in to delete a note");

    await prisma.note.delete({
      where: { id: noteId, authorId: user.id },
    });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const fetchUserNotesAction = async () => {
  try {
    const user = await getUser();
    if (!user) return { notes: [], errorMessage: null };

    const notes = await prisma.note.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        text: true,
        createdAt: true,
      },
    });

    return { notes, errorMessage: null };
  } catch (error) {
    return { notes: [], ...handleError(error) };
  }
};

export const fetchNoteByTokenAction = async (token: string) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in to view notes");

    // Temporarily return error until token column is added to database
    throw new Error(
      "Token-based access is not available until database migration is complete",
    );

    /* 
    // This code will work after adding the token column to the database
    const note = await prisma.note.findFirst({
      where: { 
        token,
        authorId: user.id 
      },
    });

    if (!note) throw new Error("Note not found or unauthorized");

    return { note, errorMessage: null };
    */
  } catch (error) {
    return { note: null, ...handleError(error) };
  }
};

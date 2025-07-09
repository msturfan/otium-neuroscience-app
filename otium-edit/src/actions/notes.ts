"use server";

import { getUser } from "@/auth/server";
import { prisma } from "@/db/prisma";
import { handleError } from "@/lib/utils";

export const createNoteAction = async (noteId: string) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in to create a note");

    const note = await prisma.note.create({
      data: {
        id: noteId,
        authorId: user.id,
        text: "",
      },
    });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const updateNoteAction = async (noteId: string, text: string) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in to update a note");

    await prisma.note.update({
      where: { id: noteId, authorId: user.id },
      data: { text },
    });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

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

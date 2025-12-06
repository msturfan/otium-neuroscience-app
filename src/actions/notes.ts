"use server";

import { getUser } from "@/auth/server";
import { prisma } from "@/db/prisma";
import { handleError } from "@/lib/utils";
import { generateNoteTitle } from "./generate-title";

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
    // Check if note exists and get current title
    const existingNote = await prisma.note.findUnique({
      where: { id },
      select: { title: true, text: true },
    });

    // Generate title if:
    // 1. Note doesn't exist yet (new note)
    // 2. Note exists but has no title
    // 3. Text has changed significantly (optional - regenerate if text changed a lot)
    let title = existingNote?.title;

    if (!title && text.trim().length > 20) {
      // Only generate title for notes with substantial content
      title = await generateNoteTitle(text);

      // If AI generation fails, use a simple fallback
      if (!title) {
        const firstLine = text.split("\n")[0].trim();
        title =
          firstLine.length > 50
            ? firstLine.substring(0, 47) + "..."
            : firstLine;
      }
    }

    const result = await prisma.note.updateMany({
      where: { id, authorId: user.id },
      data: {
        text,
        ...(title && { title }), // Only update title if generated
      },
    });

    if (result.count === 0) {
      // Note doesn't exist, create it
      await prisma.note.create({
        data: {
          id,
          authorId: user.id,
          text,
          title: title || null,
        },
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
        title: true,
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

"use server";

import { getUser } from "@/auth/server";
import { prisma } from "@/db/prisma";
import { handleError } from "@/lib/utils";
import { generateNoteTitle } from "./generate-title";

type PersistedChatMessage = {
  id: string;
  text: string;
  createdAt: string;
  isAI?: boolean;
};

export async function createNoteAction(id?: string) {
  const user = await getUser();
  if (!user) return { errorMessage: "Not signed in" };

  const noteId = id ?? crypto.randomUUID();

  try {
    await prisma.note.create({
      data: { id: noteId, authorId: user.id, text: "", chatMessages: [] },
    });
    return { id: noteId };
  } catch (e) {
    // If it already exists, treat as success
    return { id: noteId };
  }
}

// Idempotent: update text; if the note doesn't exist yet, create it with that text.
export async function updateNoteAction(
  id: string,
  text: string,
  chatMessages?: PersistedChatMessage[],
) {
  const user = await getUser();
  if (!user) return { errorMessage: "Not signed in" };

  try {
    // Check if note exists and get current title
    const existingNote = await prisma.note.findUnique({
      where: { id },
      select: { title: true, text: true },
    });
    
    // Check if this is the first note of the day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const notesToday = await prisma.note.count({
      where: {
        authorId: user.id,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
    
    const isFirstNoteOfDay = notesToday === 0;

    // Save note immediately without waiting for title generation
    const result = await prisma.note.updateMany({
      where: { id, authorId: user.id },
      data: {
        text,
        ...(chatMessages ? { chatMessages } : {}),
        // Don't update title here - it will be updated asynchronously
      },
    });

    if (result.count === 0) {
      // Note doesn't exist, create it
      await prisma.note.create({
        data: {
          id,
          authorId: user.id,
          text,
          chatMessages: chatMessages ?? [],
          title: null, // Title will be generated asynchronously
        },
      });
    }

    // Generate title in the background (non-blocking)
    const needsTitle =
      !existingNote?.title &&
      existingNote?.text !== text &&
      text.trim().length > 20;
    if (needsTitle) {
      generateNoteTitle(text)
        .then((title) => {
          if (title) {
            // Update title asynchronously
            prisma.note
              .updateMany({
                where: { id, authorId: user.id },
                data: { title },
              })
              .catch((error) => {
                console.error("Error updating title:", error);
              });
          } else {
            // Fallback title
            const firstLine = text.split("\n")[0].trim();
            const fallbackTitle =
              firstLine.length > 50
                ? firstLine.substring(0, 47) + "..."
                : firstLine;
            prisma.note
              .updateMany({
                where: { id, authorId: user.id },
                data: { title: fallbackTitle },
              })
              .catch((error) => {
                console.error("Error updating fallback title:", error);
              });
          }
        })
        .catch((error) => {
          console.error("Error generating title:", error);
        });
    }

    // Note: Greeting generation is now handled on the client side
    // to ensure accurate user local time and better UX with loading indicators

    // Return immediately without waiting for greeting
    return { id, isFirstNoteOfDay };
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

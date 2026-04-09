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

export async function createNeuroscienceAction(id?: string) {
  const user = await getUser();
  if (!user) return { errorMessage: "Not signed in" };

  const noteId = id ?? crypto.randomUUID();

  try {
    await prisma.neuroscience.create({
      data: {
        id: noteId,
        authorId: user.id,
        text: "",
        chatMessages: [],
        token: crypto.randomUUID(),
      },
    });
    return { id: noteId };
  } catch (e) {
    return { id: noteId, errorMessage: handleError(e).errorMessage || "Failed to create note" };
  }
}

export async function updateNeuroscienceAction(
  id: string,
  text: string,
  chatMessages?: PersistedChatMessage[],
) {
  const user = await getUser();
  if (!user) return { errorMessage: "Not signed in" };

  try {
    const existingNote = await prisma.neuroscience.findUnique({
      where: { id },
      select: { title: true, text: true },
    });

    const result = await prisma.neuroscience.updateMany({
      where: { id, authorId: user.id },
      data: {
        text,
        ...(chatMessages ? { chatMessages } : {}),
      },
    });

    if (result.count === 0) {
      await prisma.neuroscience.create({
        data: {
          id,
          authorId: user.id,
          text,
          chatMessages: chatMessages ?? [],
          token: crypto.randomUUID(),
          title: null,
        },
      });
    }

    const needsTitle =
      !existingNote?.title &&
      existingNote?.text !== text &&
      text.trim().length > 20;
    if (needsTitle) {
      generateNoteTitle(text)
        .then((title) => {
          if (title) {
            prisma.neuroscience
              .updateMany({
                where: { id, authorId: user.id },
                data: { title },
              })
              .catch(console.error);
          } else {
            const firstLine = text.split("\n")[0].trim();
            const fallbackTitle =
              firstLine.length > 50
                ? firstLine.substring(0, 47) + "..."
                : firstLine;
            prisma.neuroscience
              .updateMany({
                where: { id, authorId: user.id },
                data: { title: fallbackTitle },
              })
              .catch(console.error);
          }
        })
        .catch(console.error);
    }

    return { id };
  } catch (e) {
    return { errorMessage: "DB error" };
  }
}

export const deleteNeuroscienceAction = async (noteId: string) => {
  try {
    const user = await getUser();
    if (!user) throw new Error("You must be logged in to delete");

    await prisma.neuroscience.delete({
      where: { id: noteId, authorId: user.id },
    });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const fetchUserNeuroscienceAction = async () => {
  try {
    const user = await getUser();
    if (!user) return { notes: [], errorMessage: null };

    const notes = await prisma.neuroscience.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        text: true,
        title: true,
        token: true,
        createdAt: true,
      },
    });

    return { notes, errorMessage: null };
  } catch (error) {
    return { notes: [], ...handleError(error) };
  }
};

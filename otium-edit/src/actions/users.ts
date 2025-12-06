"use server";

import { createClient } from "@/auth/server";
import { prisma } from "@/db/prisma";
import { handleError } from "@/lib/utils";

export const loginAction = async (email: string, password: string) => {
  try {
    const { auth } = await createClient();

    const { data, error } = await auth.signInWithPassword({
      email,
      password,
    });

    // Check for authentication errors first
    if (error) {
      // Provide user-friendly error messages for common cases
      if (
        error.message.includes("Invalid login credentials") ||
        error.message.includes("Email not confirmed") ||
        error.status === 400
      ) {
        return {
          errorMessage:
            "Invalid email or password. Please check your credentials and try again.",
          requiresEmailVerification: false,
        };
      }
      throw error;
    }

    // Check if user exists (authentication was successful)
    if (!data.user) {
      return {
        errorMessage:
          "Invalid email or password. Please check your credentials and try again.",
        requiresEmailVerification: false,
      };
    }

    // Check if email is verified
    const emailConfirmed = data.user.email_confirmed_at !== null;

    if (!emailConfirmed) {
      // Sign out the user if email is not verified
      await auth.signOut();
      return {
        errorMessage:
          "Please verify your email before logging in. Check your inbox for the verification link.",
        requiresEmailVerification: false,
      };
    }

    return { errorMessage: null, requiresEmailVerification: false };
  } catch (error) {
    // Handle any unexpected errors
    const errorResult = handleError(error);
    // Ensure we provide a user-friendly message for authentication failures
    if (
      errorResult.errorMessage.includes("Invalid") ||
      errorResult.errorMessage.includes("credentials") ||
      errorResult.errorMessage.includes("email") ||
      errorResult.errorMessage.includes("password")
    ) {
      return {
        errorMessage:
          "Invalid email or password. Please check your credentials and try again.",
        requiresEmailVerification: false,
      };
    }
    return { ...errorResult, requiresEmailVerification: false };
  }
};

export const logOutAction = async () => {
  try {
    const { auth } = await createClient();

    const { error } = await auth.signOut();
    if (error) throw error;

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const signUpAction = async (
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
  dob?: Date,
) => {
  try {
    const { auth } = await createClient();

    const { data, error } = await auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      },
    });
    if (error) throw error;

    const userId = data.user?.id;
    if (!userId) throw new Error("Error signing up");

    // Check if email confirmation is required
    const emailConfirmed = data.user?.email_confirmed_at !== null;

    // Use upsert to handle case where user might already exist
    await prisma.user.upsert({
      where: { id: userId },
      update: {
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        dob: dob || null,
      },
      create: {
        id: userId,
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        dob: dob || null,
      },
    });

    // Return success with email verification status
    return {
      errorMessage: null,
      requiresEmailVerification: !emailConfirmed,
    };
  } catch (error) {
    return { ...handleError(error), requiresEmailVerification: false };
  }
};

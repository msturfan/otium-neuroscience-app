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
    if (error) throw error;

    const user = data.user;
    if (!user) throw new Error("Login failed");

    // SECURITY CHECK 1: Ensure email is verified
    if (!user.email_confirmed_at) {
      // Sign out the user immediately if email not verified
      await auth.signOut();
      throw new Error(
        "Please verify your email before logging in. Check your inbox for a verification link.",
      );
    }

    // SECURITY CHECK 2: Check if user exists and is active in our database
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: {
        id: true,
        email: true,
      },
    });

    // If user was deleted from database but still exists in Supabase auth
    if (!existingUser) {
      // Check if this is truly a first-time login (new user)
      // We can verify this by checking if the user was created recently
      const userCreatedAt = new Date(user.created_at);
      const now = new Date();
      const timeDiff = now.getTime() - userCreatedAt.getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24);

      // If user was created more than 1 day ago but doesn't exist in DB,
      // they were likely deleted - don't allow login
      if (daysDiff > 1) {
        await auth.signOut();
        throw new Error(
          "This account is no longer active. Please contact support or create a new account.",
        );
      }

      // This is a legitimate first login after email verification
      const newUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          firstName: "User",
          lastName: user.email!.split("@")[0],
          profileImage: null,
          isGuest: false,
          hasCompletedOnboarding: true,
        },
      });
    }

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
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

export const signUpAction = async (email: string, password: string) => {
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

    // Check if user already exists (email already registered)
    if (data.user && !data.user.email_confirmed_at) {
      return {
        errorMessage: null,
        message:
          "Please check your email and click the verification link to complete your registration.",
      };
    }

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const updateUserProfileAction = async (
  userId: string,
  firstName: string,
  lastName: string,
  profileImageUrl?: string,
) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        profileImage: profileImageUrl || null,
        hasCompletedOnboarding: true,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        hasCompletedOnboarding: true,
      },
    });

    return { user: updatedUser, errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const getCurrentUserAction = async () => {
  try {
    const { auth } = await createClient();
    const {
      data: { user },
      error,
    } = await auth.getUser();

    if (error || !user) {
      throw new Error("User not authenticated");
    }

    // SECURITY: Verify email is confirmed
    if (!user.email_confirmed_at) {
      throw new Error("Email not verified");
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        isGuest: true,
        hasCompletedOnboarding: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!dbUser) {
      // User exists in Supabase but not in our database - they were deleted
      await auth.signOut();
      throw new Error("Account no longer exists");
    }

    return { user: dbUser, errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const createGuestUserAction = async () => {
  try {
    const guestUser = await prisma.user.create({
      data: {
        email: `guest_${Date.now()}@example.com`,
        firstName: "Guest",
        lastName: "User",
        profileImage: `https://ui-avatars.com/api/?name=G&background=6366f1&color=fff&size=200&bold=true`,
        isGuest: true,
        hasCompletedOnboarding: true,
      },
    });

    return { user: guestUser, errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

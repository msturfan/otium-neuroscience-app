import { prisma } from "@/db/prisma";
import { User } from "@supabase/supabase-js";

export async function getUserProfile(user: User | null) {
  if (!user) {
    return null;
  }

  try {
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!userProfile) {
      return null;
    }

    // Generate full name from firstName and lastName
    const nameParts: string[] = [];
    if (userProfile.firstName) {
      nameParts.push(userProfile.firstName);
    }
    if (userProfile.lastName) {
      nameParts.push(userProfile.lastName);
    }
    const fullName =
      nameParts.length > 0 ? nameParts.join(" ") : userProfile.email;

    // Generate avatar initials
    const initials =
      nameParts.length > 0
        ? `${userProfile.firstName?.[0] || ""}${userProfile.lastName?.[0] || ""}`.toUpperCase()
        : userProfile.email[0].toUpperCase();

    // Generate avatar URL using a service (or use initials as fallback)
    // Using ui-avatars.com for avatar generation with black and white theme
    // Format: black background (000000) with white text (ffffff)
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=000000&color=ffffff&size=128&bold=true`;

    return {
      name: fullName,
      email: userProfile.email,
      avatar,
      initials,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    // Fallback to basic user data
    return {
      name: user.email || "User",
      email: user.email || "",
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || "User")}&background=000000&color=ffffff&size=128&bold=true`,
      initials: user.email?.[0].toUpperCase() || "U",
    };
  }
}

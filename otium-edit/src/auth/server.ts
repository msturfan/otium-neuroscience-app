import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  const client = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {}
        },
      },
    },
  );

  return client;
}

export async function getUser() {
  try {
    const { auth } = await createClient();

    const userObject = await auth.getUser();

    if (userObject.error) {
      // Don't log AuthSessionMissingError as it's expected for unauthenticated users
      if (userObject.error.name !== "AuthSessionMissingError") {
        console.error(userObject.error);
      }
      return null;
    }

    return userObject.data.user;
  } catch (error) {
    // Handle any thrown errors (like AuthSessionMissingError)
    // This is expected for pages like sign-up/login where there's no session
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "AuthSessionMissingError"
    ) {
      return null;
    }
    // Log other unexpected errors
    console.error("Unexpected error in getUser:", error);
    return null;
  }
}
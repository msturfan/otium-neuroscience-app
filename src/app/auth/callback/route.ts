import { createClient } from "@/auth/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();

    // Exchange code for session (for email verification during signup)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      // If user is logged in, redirect to account page, otherwise to login
      if (data.session) {
        return NextResponse.redirect(new URL("/account", requestUrl.origin));
      } else {
        return NextResponse.redirect(
          new URL("/login?verified=true", requestUrl.origin),
        );
      }
    } else if (error) {
      console.error("Error exchanging code for session:", error);
    }
  }

  // If there's an error or no code, redirect to login
  return NextResponse.redirect(
    new URL("/login?error=verification_failed", requestUrl.origin),
  );
}

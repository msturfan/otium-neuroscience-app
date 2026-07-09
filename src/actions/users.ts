"use server";

import { createClient } from "@/auth/server";
import { prisma } from "@/db/prisma";
import { handleError } from "@/lib/utils";
import {
  checkRateLimitDual,
  recordFailedAttemptDual,
  clearRateLimitDual,
  logSecurityEvent,
  normalizeResponseTiming,
} from "@/lib/rate-limit";
import {
  isDisposableEmail,
  isValidEmail,
  checkPasswordStrength,
} from "@/lib/utils";
import { verifyTurnstileToken } from "@/lib/turnstile-verify";
import { getClientIP } from "@/lib/rate-limit";
import { getSecureSiteUrl } from "@/lib/secure-redirect";

export const loginAction = async (
  email: string,
  password: string,
  captchaToken?: string,
) => {
  const startTime = Date.now();

  try {
    // Validate email format
    if (!isValidEmail(email)) {
      await normalizeResponseTiming(startTime);
      return {
        errorMessage: "Please enter a valid email address.",
        requiresEmailVerification: false,
        requiresCaptcha: false,
      };
    }

    // Check rate limit before attempting login
    const rateLimitCheck = await checkRateLimitDual(email, "login");
    if (!rateLimitCheck.allowed) {
      await normalizeResponseTiming(startTime);
      return {
        errorMessage:
          rateLimitCheck.errorMessage ||
          "Too many login attempts. Please try again later.",
        requiresEmailVerification: false,
        requiresCaptcha: rateLimitCheck.requiresCaptcha,
      };
    }

    // CAPTCHA is NOT required on first attempt
    // It will be required after first failed attempt (handled in error section below)

    const { auth } = await createClient();

    const { data, error } = await auth.signInWithPassword({
      email,
      password,
      // Note: Supabase CAPTCHA is disabled, so we don't pass captchaToken
    });

    // Check for authentication errors first
    if (error) {
      // Record failed attempt for rate limiting
      // This will trigger CAPTCHA requirement after first failed attempt
      const { requiresCaptcha } = await recordFailedAttemptDual(email, "login");

      // If CAPTCHA is now required (after first failed attempt), verify it
      if (requiresCaptcha) {
        if (!captchaToken) {
          console.warn(
            "⚠️ CAPTCHA required after failed attempt but no token provided",
          );
          await normalizeResponseTiming(startTime);
          return {
            errorMessage: "Please complete the CAPTCHA verification.",
            requiresEmailVerification: false,
            requiresCaptcha: true,
          };
        }

        // Don't log token information in production (security: prevent token leakage in logs)
        if (process.env.NODE_ENV === "development") {
          console.log("🔍 Verifying CAPTCHA token with Cloudflare...");
        }

        const ip = await getClientIP();
        const isValidCaptcha = await verifyTurnstileToken(captchaToken, ip);

        if (!isValidCaptcha) {
          // Only log failures in development (security: reduce log noise in production)
          if (process.env.NODE_ENV === "development") {
            console.warn("❌ CAPTCHA token verification failed");
          }
          await normalizeResponseTiming(startTime);
          return {
            errorMessage:
              "CAPTCHA verification failed. Please complete it again.",
            requiresEmailVerification: false,
            requiresCaptcha: true,
          };
        }

        // Only log success in development (security: reduce log noise in production)
        if (process.env.NODE_ENV === "development") {
          console.log("✅ CAPTCHA token verified successfully");
        }
      }

      // Log failed login attempt
      await logSecurityEvent("login_failed", email, error.message);

      // Normalize response timing to prevent timing attacks
      await normalizeResponseTiming(startTime);

      // Provide generic error message (don't reveal if email exists)
      return {
        errorMessage:
          "Invalid email or password. Please check your credentials and try again.",
        requiresEmailVerification: false,
        requiresCaptcha,
      };
    }

    // Check if user exists (authentication was successful)
    if (!data.user) {
      // Record failed attempt for rate limiting
      const { requiresCaptcha } = await recordFailedAttemptDual(email, "login");

      // Log failed login attempt
      await logSecurityEvent("login_failed", email, "No user returned");

      await normalizeResponseTiming(startTime);
      return {
        errorMessage:
          "Invalid email or password. Please check your credentials and try again.",
        requiresEmailVerification: false,
        requiresCaptcha,
      };
    }

    // Check if email is verified
    const emailConfirmed = data.user.email_confirmed_at !== null;

    if (!emailConfirmed) {
      // Sign out the user if email is not verified
      await auth.signOut();
      // Don't record as failed attempt since credentials were correct
      // Clear CAPTCHA requirement for valid credentials
      await clearRateLimitDual(email, "login");
      await normalizeResponseTiming(startTime);
      return {
        errorMessage:
          "Please verify your email before logging in. Check your inbox for the verification link.",
        requiresEmailVerification: false,
        requiresCaptcha: false,
      };
    }

    // Clear rate limit on successful login (credentials were valid)
    await clearRateLimitDual(email, "login");

    // Log successful login
    await logSecurityEvent("login_success", email);

    await normalizeResponseTiming(startTime);
    return {
      errorMessage: null,
      requiresEmailVerification: false,
      requiresCaptcha: false,
    };
  } catch (error) {
    // Record failed attempt for unexpected errors
    const { requiresCaptcha } = await recordFailedAttemptDual(email, "login");

    // Log failed login attempt
    await logSecurityEvent(
      "login_failed",
      email,
      error instanceof Error ? error.message : "Unknown error",
    );

    await normalizeResponseTiming(startTime);

    // Handle any unexpected errors - return generic message
    return {
      errorMessage:
        "Invalid email or password. Please check your credentials and try again.",
      requiresEmailVerification: false,
      requiresCaptcha,
    };
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
  captchaToken?: string, // CAPTCHA token from client
) => {
  const startTime = Date.now();

  try {
    // Validate email format
    if (!isValidEmail(email)) {
      await normalizeResponseTiming(startTime);
      return {
        errorMessage: "Please enter a valid email address.",
        requiresEmailVerification: false,
        requiresCaptcha: true, // Always require CAPTCHA for signup
      };
    }

    // Block disposable email domains
    if (isDisposableEmail(email)) {
      await normalizeResponseTiming(startTime);
      return {
        errorMessage:
          "Please use a permanent email address. Temporary email services are not allowed.",
        requiresEmailVerification: false,
        requiresCaptcha: true, // Always require CAPTCHA for signup
      };
    }

    // Require CAPTCHA token for signup (always required)
    // Note: Supabase CAPTCHA is disabled, so we verify it ourselves
    if (!captchaToken) {
      await normalizeResponseTiming(startTime);
      return {
        errorMessage: "Please complete the CAPTCHA verification.",
        requiresEmailVerification: false,
        requiresCaptcha: true,
      };
    }

    // Verify CAPTCHA token server-side with Cloudflare
    // Don't log token information in production (security: prevent token leakage in logs)
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Verifying CAPTCHA token for signup with Cloudflare...");
    }
    const ip = await getClientIP();
    const isValidCaptcha = await verifyTurnstileToken(captchaToken, ip);
    if (!isValidCaptcha) {
      await normalizeResponseTiming(startTime);
      return {
        errorMessage: "CAPTCHA verification failed. Please try again.",
        requiresEmailVerification: false,
        requiresCaptcha: true,
      };
    }
    // Only log success in development (security: reduce log noise in production)
    if (process.env.NODE_ENV === "development") {
      console.log("✅ CAPTCHA token verified successfully for signup");
    }

    // Check rate limit before attempting signup
    const rateLimitCheck = await checkRateLimitDual(email, "signup");
    if (!rateLimitCheck.allowed) {
      await normalizeResponseTiming(startTime);
      return {
        errorMessage:
          rateLimitCheck.errorMessage ||
          "Too many signup attempts. Please try again later.",
        requiresEmailVerification: false,
        requiresCaptcha: true, // Always require CAPTCHA
      };
    }

    // Enforce hard minimum length requirement (8 characters)
    if (password.length < 8) {
      await normalizeResponseTiming(startTime);
      return {
        errorMessage: "Password must be at least 8 characters long.",
        requiresEmailVerification: false,
        requiresCaptcha: true,
      };
    }

    // Validate password strength server-side
    const passwordStrength = checkPasswordStrength(password);
    if (passwordStrength.score < 2) {
      // Require at least "Fair" strength (score 2)
      await normalizeResponseTiming(startTime);
      return {
        errorMessage:
          "Password is too weak. Please use a stronger password with at least 8 characters, including uppercase, lowercase, and numbers.",
        requiresEmailVerification: false,
        requiresCaptcha: true,
      };
    }

    const { auth } = await createClient();

    // Check if user already exists in database before attempting signup
    // This prevents sending signup emails to existing users
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

      if (existingUser) {
        // User already exists - don't send signup email
        // Return success without revealing user exists (prevent email enumeration)
        if (process.env.NODE_ENV === "development") {
          console.log("User already exists, skipping signup email");
        }

      // Clear rate limit (treat as success for rate limiting purposes)
      await clearRateLimitDual(email, "signup");

      // Log this as a signup attempt (but don't send email)
      await logSecurityEvent("signup_attempt_existing_user", email);

      await normalizeResponseTiming(startTime);

      // Return generic success message (don't reveal user exists)
      return {
        errorMessage: null,
        requiresEmailVerification: false,
        requiresCaptcha: false,
      };
    }

    // Get secure site URL (server-only, HTTPS-enforced in production)
    const siteUrl = getSecureSiteUrl();

    const { data, error } = await auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
        // Note: Supabase CAPTCHA is disabled, so we don't pass captchaToken
      },
    });

    if (error) {
      // Check if error is due to user already existing in Supabase auth
      // (but not in our database - edge case)
      const isUserExistsError =
        error.message?.toLowerCase().includes("already registered") ||
        error.message?.toLowerCase().includes("user already exists") ||
        error.status === 422; // Supabase returns 422 for existing user

      if (isUserExistsError) {
        // User exists in Supabase but not in our DB - don't send email
        // Return success without revealing user exists
        if (process.env.NODE_ENV === "development") {
          console.log(
            "User already exists in Supabase auth, skipping signup email",
          );
        }

        // Clear rate limit (treat as success)
        await clearRateLimitDual(email, "signup");

        // Log this as a signup attempt (but don't send email)
        await logSecurityEvent("signup_attempt_existing_user", email);

        await normalizeResponseTiming(startTime);

        // Return generic success message (don't reveal user exists)
        return {
          errorMessage: null,
          requiresEmailVerification: false,
          requiresCaptcha: false,
        };
      }

      // Record failed attempt for rate limiting
      const { requiresCaptcha } = await recordFailedAttemptDual(
        email,
        "signup",
      );

      // Log failed signup
      await logSecurityEvent("signup_failed", email, error.message);

      await normalizeResponseTiming(startTime);

      // Return generic message to prevent email enumeration
      // (don't reveal if email already exists)
      return {
        errorMessage:
          "Unable to create account. Please try again or use a different email.",
        requiresEmailVerification: false,
        requiresCaptcha,
      };
    }

    const userId = data.user?.id;
    if (!userId) {
      // Record failed attempt for rate limiting
      const { requiresCaptcha } = await recordFailedAttemptDual(
        email,
        "signup",
      );

      // Log failed signup
      await logSecurityEvent("signup_failed", email, "No user ID returned");

      await normalizeResponseTiming(startTime);
      return {
        errorMessage:
          "Unable to create account. Please try again or use a different email.",
        requiresEmailVerification: false,
        requiresCaptcha,
      };
    }

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

    // Clear rate limit on successful signup
    await clearRateLimitDual(email, "signup");

    // Log successful signup
    await logSecurityEvent("signup_success", email);

    await normalizeResponseTiming(startTime);

    // Return success with email verification status
    return {
      errorMessage: null,
      requiresEmailVerification: !emailConfirmed,
      requiresCaptcha: false,
    };
  } catch (error) {
    // Record failed attempt if not already recorded
    const { requiresCaptcha } = await recordFailedAttemptDual(email, "signup");

    // Log failed signup
    await logSecurityEvent(
      "signup_failed",
      email,
      error instanceof Error ? error.message : "Unknown error",
    );

    await normalizeResponseTiming(startTime);

    // Return generic message
    return {
      errorMessage:
        "Unable to create account. Please try again or use a different email.",
      requiresEmailVerification: false,
      requiresCaptcha,
    };
  }
};

export const updateFirstNameAction = async (firstName: string) => {
  try {
    const { auth } = await createClient();
    const {
      data: { user },
    } = await auth.getUser();

    if (!user) {
      return { errorMessage: "User not authenticated" };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { firstName },
    });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const updateLastNameAction = async (lastName: string) => {
  try {
    const { auth } = await createClient();
    const {
      data: { user },
    } = await auth.getUser();

    if (!user) {
      return { errorMessage: "User not authenticated" };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastName },
    });

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const updatePasswordAction = async (
  oldPassword: string,
  newPassword: string,
) => {
  try {
    const { auth } = await createClient();
    const {
      data: { user },
    } = await auth.getUser();

    if (!user) {
      return { errorMessage: "User not authenticated" };
    }

    if (!user.email) {
      return { errorMessage: "User email not found" };
    }

    // Enforce hard minimum length requirement (8 characters)
    if (newPassword.length < 8) {
      return {
        errorMessage: "Password must be at least 8 characters long.",
      };
    }

    // Validate password strength
    const passwordStrength = checkPasswordStrength(newPassword);
    if (passwordStrength.score < 2) {
      return {
        errorMessage:
          "Password is too weak. Please use a stronger password with at least 8 characters, including uppercase, lowercase, and numbers.",
      };
    }

    // Verify old password by attempting to sign in
    const { error: verifyError } = await auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    });

    if (verifyError) {
      return { errorMessage: "Current password is incorrect" };
    }

    // Update password
    const { error: updateError } = await auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw updateError;
    }

    return { errorMessage: null };
  } catch (error) {
    return handleError(error);
  }
};

export const resetPasswordAction = async (
  email: string,
  captchaToken?: string,
) => {
  const startTime = Date.now();

  try {
    // Validate email format
    if (!isValidEmail(email)) {
      await normalizeResponseTiming(startTime);
      // Still return generic success to prevent email enumeration
      return {
        errorMessage: null,
        success: true,
        message:
          "If an account exists for that email, a reset link has been sent.",
        requiresCaptcha: false,
      };
    }

    // Require CAPTCHA token for password reset (always required)
    // Note: Supabase CAPTCHA is disabled, so we verify it ourselves
    if (!captchaToken) {
      await normalizeResponseTiming(startTime);
      return {
        errorMessage: "Please complete the CAPTCHA verification.",
        success: false,
        requiresCaptcha: true,
      };
    }

    // Verify CAPTCHA token server-side with Cloudflare
    // Don't log token information in production (security: prevent token leakage in logs)
    if (process.env.NODE_ENV === "development") {
      console.log(
        "🔍 Verifying CAPTCHA token for password reset with Cloudflare...",
      );
    }
    const ip = await getClientIP();
    const isValidCaptcha = await verifyTurnstileToken(captchaToken, ip);
    if (!isValidCaptcha) {
      await normalizeResponseTiming(startTime);
      return {
        errorMessage: "CAPTCHA verification failed. Please try again.",
        success: false,
        requiresCaptcha: true,
      };
    }
    // Only log success in development (security: reduce log noise in production)
    if (process.env.NODE_ENV === "development") {
      console.log("✅ CAPTCHA token verified successfully for password reset");
    }

    // Check rate limit before attempting password reset
    const rateLimitCheck = await checkRateLimitDual(email, "password_reset");
    if (!rateLimitCheck.allowed) {
      await normalizeResponseTiming(startTime);
      return {
        errorMessage:
          rateLimitCheck.errorMessage ||
          "Too many password reset attempts. Please try again later.",
        success: false,
        requiresCaptcha: true, // Always require CAPTCHA
      };
    }

    const { auth } = await createClient();

    // Get secure site URL (server-only, HTTPS-enforced in production)
    const siteUrl = getSecureSiteUrl();
    const redirectTo = `${siteUrl}/update-password`;

    // Note: Supabase CAPTCHA is disabled, so we don't pass captchaToken
    const { error } = await auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    // Log password reset request (regardless of success/failure)
    await logSecurityEvent("password_reset_request", email, error?.message);

    if (error) {
      // Record failed attempt for rate limiting
      const { requiresCaptcha } = await recordFailedAttemptDual(
        email,
        "password_reset",
      );

      await normalizeResponseTiming(startTime);

      // Still return generic success to prevent email enumeration
      return {
        errorMessage: null,
        success: true,
        message:
          "If an account exists for that email, a reset link has been sent.",
        requiresCaptcha,
      };
    }

    // Clear rate limit on successful request
    await clearRateLimitDual(email, "password_reset");

    await normalizeResponseTiming(startTime);

    // Always return success message to prevent email enumeration
    return {
      errorMessage: null,
      success: true,
      message:
        "If an account exists for that email, a reset link has been sent.",
      requiresCaptcha: false,
    };
  } catch (error) {
    // Log error
    await logSecurityEvent(
      "password_reset_request",
      email,
      error instanceof Error ? error.message : "Unknown error",
    );

    await normalizeResponseTiming(startTime);

    // Still return generic success message to prevent email enumeration
    return {
      errorMessage: null,
      success: true,
      message:
        "If an account exists for that email, a reset link has been sent.",
      requiresCaptcha: false,
    };
  }
};

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extract error details for internal logging (server-side only)
 * DO NOT expose this to clients - use handleError() instead
 */
export const getErrorDetails = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "Unknown error";
};

/**
 * Handle errors for client-facing responses
 * Returns generic messages to prevent information disclosure
 */
export const handleError = (error: unknown) => {
  if (error instanceof Error) {
    // Handle Prisma/Database errors - return generic messages
    // to prevent account enumeration and information disclosure
    if (
      error.message.includes("Unique constraint") ||
      error.message.includes("already exists") ||
      error.message.includes("duplicate")
    ) {
      // Don't reveal if a user/email already exists
      return { errorMessage: "Unable to complete request. Please try again." };
    }
    if (error.message.includes("Foreign key constraint")) {
      return { errorMessage: "Unable to complete request. Please try again." };
    }
    if (
      error.message.includes("not found") ||
      error.message.includes("Not found")
    ) {
      // Don't reveal if a resource doesn't exist
      return { errorMessage: "Unable to complete request. Please try again." };
    }
    // For auth-related errors, return generic message
    if (
      error.message.toLowerCase().includes("email") ||
      error.message.toLowerCase().includes("user") ||
      error.message.toLowerCase().includes("password") ||
      error.message.toLowerCase().includes("credential") ||
      error.message.toLowerCase().includes("authentication")
    ) {
      return { errorMessage: "Unable to complete request. Please try again." };
    }
    // For other errors, still be cautious about what we expose
    // Only return the message if it doesn't contain sensitive patterns
    const sensitivePatterns = [
      /email/i,
      /user/i,
      /password/i,
      /token/i,
      /session/i,
      /database/i,
      /prisma/i,
      /supabase/i,
    ];
    const isSensitive = sensitivePatterns.some((pattern) =>
      pattern.test(error.message),
    );
    if (isSensitive) {
      return { errorMessage: "An error occurred. Please try again." };
    }
    return { errorMessage: error.message };
  }
  // Handle non-Error objects
  if (error && typeof error === "object" && "message" in error) {
    const message = String(error.message);
    // Apply same sanitization
    const sensitivePatterns = [
      /email/i,
      /user/i,
      /password/i,
      /token/i,
      /session/i,
    ];
    const isSensitive = sensitivePatterns.some((pattern) =>
      pattern.test(message),
    );
    if (isSensitive) {
      return { errorMessage: "An error occurred. Please try again." };
    }
    return { errorMessage: message };
  }
  return { errorMessage: "An error occurred" };
};

export function formatNoteDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const year = String(dateObj.getFullYear()).slice(-2);
  return `${month}-${day}-${year}`;
}

export type PasswordStrength = {
  score: number; // 0-4
  label: "Very Weak" | "Weak" | "Fair" | "Good" | "Strong";
  color: string;
};

export function checkPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: "Very Weak", color: "bg-red-500" };
  }

  let score = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
    long: password.length >= 12,
  };

  if (checks.length) score++;
  if (checks.lowercase) score++;
  if (checks.uppercase) score++;
  if (checks.number) score++;
  if (checks.special) score++;
  if (checks.long) score++;

  // Map score (0-6) to normalized score (0-4)
  // 0-1 checks: 0 (Very Weak)
  // 2 checks: 1 (Weak)
  // 3 checks: 2 (Fair)
  // 4-5 checks: 3 (Good)
  // 6 checks: 4 (Strong)
  let normalizedScore = 0;
  if (score >= 6) {
    normalizedScore = 4;
  } else if (score >= 4) {
    normalizedScore = 3;
  } else if (score >= 3) {
    normalizedScore = 2;
  } else if (score >= 2) {
    normalizedScore = 1;
  }

  const strengthMap: Record<number, Omit<PasswordStrength, "score">> = {
    0: { label: "Very Weak", color: "bg-red-500" },
    1: { label: "Weak", color: "bg-orange-500" },
    2: { label: "Fair", color: "bg-yellow-500" },
    3: { label: "Good", color: "bg-blue-500" },
    4: { label: "Strong", color: "bg-green-500" },
  };

  return {
    score: normalizedScore,
    ...strengthMap[normalizedScore],
  };
}

// Common disposable email domains to block
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "tempmail.com",
  "throwaway.email",
  "guerrillamail.com",
  "mailinator.com",
  "10minutemail.com",
  "temp-mail.org",
  "fakeinbox.com",
  "trashmail.com",
  "getnada.com",
  "maildrop.cc",
  "yopmail.com",
  "tempail.com",
  "dispostable.com",
  "mintemail.com",
  "sharklasers.com",
  "spam4.me",
  "grr.la",
  "guerrillamail.info",
  "pokemail.net",
  "spamgourmet.com",
]);

/**
 * Check if email domain is from a disposable email provider
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.toLowerCase().split("@")[1];
  return domain ? DISPOSABLE_EMAIL_DOMAINS.has(domain) : false;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const handleError = (error: unknown) => {
  if (error instanceof Error) {
    // Handle Prisma errors
    if (error.message.includes("Unique constraint")) {
      return { errorMessage: "A user with this email already exists" };
    }
    if (error.message.includes("Foreign key constraint")) {
      return { errorMessage: "Database constraint error. Please try again." };
    }
    return { errorMessage: error.message };
  }
  // Handle non-Error objects (like Supabase errors)
  if (error && typeof error === "object" && "message" in error) {
    return { errorMessage: String(error.message) };
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

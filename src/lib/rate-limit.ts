"use server";

import { headers } from "next/headers";
import { prisma } from "@/db/prisma";

export type RateLimitAction = "login" | "signup" | "password_reset";
export type SecurityEventType =
  | "login_failed"
  | "login_success"
  | "signup_failed"
  | "signup_success"
  | "signup_attempt_existing_user"
  | "password_reset_request"
  | "lockout_triggered"
  | "captcha_triggered";

interface RateLimitConfig {
  maxAttempts: number; // Maximum attempts before lockout
  windowMinutes: number; // Time window in minutes
  baseLockoutMinutes: number; // Base lockout duration (for exponential backoff)
  maxLockoutMinutes: number; // Maximum lockout duration
  captchaTriggerAttempts: number; // Attempts before CAPTCHA is required
}

const RATE_LIMIT_CONFIGS: Record<RateLimitAction, RateLimitConfig> = {
  login: {
    maxAttempts: 5, // 5 failed attempts
    windowMinutes: 15, // within 15 minutes
    baseLockoutMinutes: 5, // Start with 5 minutes
    maxLockoutMinutes: 60, // Max 1 hour
    captchaTriggerAttempts: 3, // CAPTCHA after 3 attempts
  },
  signup: {
    maxAttempts: 3, // 3 signup attempts
    windowMinutes: 60, // within 1 hour
    baseLockoutMinutes: 30, // Start with 30 minutes
    maxLockoutMinutes: 240, // Max 4 hours
    captchaTriggerAttempts: 2, // CAPTCHA after 2 attempts
  },
  password_reset: {
    maxAttempts: 3, // 3 reset attempts
    windowMinutes: 60, // within 1 hour
    baseLockoutMinutes: 30, // Start with 30 minutes
    maxLockoutMinutes: 240, // Max 4 hours
    captchaTriggerAttempts: 2, // CAPTCHA after 2 attempts
  },
};

/**
 * Get client IP address from request headers
 * Supports Cloudflare (CF-Connecting-IP) and standard headers
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers();

  // Cloudflare provides the real IP in CF-Connecting-IP
  const cfIp = headersList.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  // Fallback to x-forwarded-for (first IP in chain)
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    return ips[0] || "unknown";
  }

  // Fallback to x-real-ip
  const realIp = headersList.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

/**
 * Get request metadata for logging
 */
export async function getRequestMetadata(): Promise<{
  ip: string;
  userAgent: string | null;
  country: string | null;
}> {
  const headersList = await headers();

  return {
    ip: await getClientIP(),
    userAgent: headersList.get("user-agent"),
    country: headersList.get("cf-ipcountry"), // Cloudflare country header
  };
}

/**
 * Calculate exponential backoff lockout duration
 * Formula: baseLockout * 2^consecutiveLockouts (capped at max)
 */
function calculateLockoutDuration(
  baseLockoutMinutes: number,
  maxLockoutMinutes: number,
  consecutiveLockouts: number,
): number {
  const duration = baseLockoutMinutes * Math.pow(2, consecutiveLockouts);
  return Math.min(duration, maxLockoutMinutes);
}

/**
 * Log security audit event
 */
export async function logSecurityEvent(
  eventType: SecurityEventType,
  email?: string,
  failureReason?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const { ip, userAgent, country } = await getRequestMetadata();

    await prisma.securityAuditLog.create({
      data: {
        eventType,
        ipAddress: ip,
        email: email?.toLowerCase(),
        userAgent,
        country,
        failureReason,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    // Don't let logging failures affect the main flow
    // This includes cases where the table doesn't exist yet
    // Silently fail - logging is non-critical
  }
}

/**
 * Check if an identifier (IP or email) is rate limited for a specific action
 * Returns rate limit status and whether CAPTCHA is required
 */
export async function checkRateLimit(
  identifier: string,
  actionType: RateLimitAction,
): Promise<{
  allowed: boolean;
  errorMessage?: string;
  retryAfter?: number;
  requiresCaptcha: boolean;
}> {
  const config = RATE_LIMIT_CONFIGS[actionType];
  const now = new Date();

  try {
    // Find or create rate limit record
    const rateLimit = await prisma.rateLimitAttempt.upsert({
      where: {
        identifier_actionType: {
          identifier,
          actionType,
        },
      },
      update: {},
      create: {
        identifier,
        actionType,
        attemptCount: 0,
        consecutiveLockouts: 0,
        requiresCaptcha: false,
      },
    });

    // Check if currently locked out
    if (rateLimit.lockedUntil && rateLimit.lockedUntil > now) {
      const retryAfter = Math.ceil(
        (rateLimit.lockedUntil.getTime() - now.getTime()) / 1000 / 60,
      );
      return {
        allowed: false,
        errorMessage: `Too many attempts. Please try again in ${retryAfter} minute${retryAfter !== 1 ? "s" : ""}.`,
        retryAfter,
        requiresCaptcha: true, // Always require CAPTCHA after lockout
      };
    }

    // Reset lockout if expired
    if (rateLimit.lockedUntil && rateLimit.lockedUntil <= now) {
      await prisma.rateLimitAttempt.update({
        where: { id: rateLimit.id },
        data: {
          lockedUntil: null,
          attemptCount: 0,
          // Keep consecutiveLockouts for exponential backoff
          // Keep requiresCaptcha true after lockout
          requiresCaptcha: true,
        },
      });
      return { allowed: true, requiresCaptcha: true };
    }

    // Check if within rate limit window
    const windowStart = new Date(
      now.getTime() - config.windowMinutes * 60 * 1000,
    );

    if (rateLimit.lastAttempt < windowStart) {
      // Outside window, reset attempt count but keep CAPTCHA requirement if set
      await prisma.rateLimitAttempt.update({
        where: { id: rateLimit.id },
        data: {
          attemptCount: 0,
          // Reset consecutiveLockouts after successful window
          consecutiveLockouts: 0,
        },
      });
      return { allowed: true, requiresCaptcha: rateLimit.requiresCaptcha };
    }

    // Check if exceeded max attempts
    if (rateLimit.attemptCount >= config.maxAttempts) {
      const newConsecutiveLockouts = rateLimit.consecutiveLockouts + 1;
      const lockoutDuration = calculateLockoutDuration(
        config.baseLockoutMinutes,
        config.maxLockoutMinutes,
        rateLimit.consecutiveLockouts,
      );

      // Lock out the identifier with exponential backoff
      const lockoutUntil = new Date(
        now.getTime() + lockoutDuration * 60 * 1000,
      );

      await prisma.rateLimitAttempt.update({
        where: { id: rateLimit.id },
        data: {
          lockedUntil: lockoutUntil,
          consecutiveLockouts: newConsecutiveLockouts,
          requiresCaptcha: true,
        },
      });

      // Log lockout event
      await logSecurityEvent("lockout_triggered", undefined, undefined, {
        identifier,
        actionType,
        lockoutDuration,
        consecutiveLockouts: newConsecutiveLockouts,
      });

      return {
        allowed: false,
        errorMessage: `Too many attempts. Account temporarily locked for ${lockoutDuration} minutes.`,
        retryAfter: lockoutDuration,
        requiresCaptcha: true,
      };
    }

    // Check if CAPTCHA should be triggered
    const shouldTriggerCaptcha =
      rateLimit.attemptCount >= config.captchaTriggerAttempts ||
      rateLimit.requiresCaptcha;

    return { allowed: true, requiresCaptcha: shouldTriggerCaptcha };
  } catch (error) {
    // If database error (e.g., table doesn't exist), allow the request
    console.error("Rate limit check failed:", error);
    return { allowed: true, requiresCaptcha: false };
  }
}

/**
 * Record a failed attempt for rate limiting
 * Automatically locks if max attempts are reached with exponential backoff
 */
export async function recordFailedAttempt(
  identifier: string,
  actionType: RateLimitAction,
): Promise<{ requiresCaptcha: boolean }> {
  const config = RATE_LIMIT_CONFIGS[actionType];
  const now = new Date();

  try {
    // Get current rate limit record
    const rateLimit = await prisma.rateLimitAttempt.upsert({
      where: {
        identifier_actionType: {
          identifier,
          actionType,
        },
      },
      update: {},
      create: {
        identifier,
        actionType,
        attemptCount: 0,
        consecutiveLockouts: 0,
        requiresCaptcha: false,
      },
    });

    const windowStart = new Date(
      now.getTime() - config.windowMinutes * 60 * 1000,
    );

    // Reset if outside window
    const effectiveAttemptCount =
      rateLimit.lastAttempt < windowStart ? 1 : rateLimit.attemptCount + 1;

    // Check if we should lock with exponential backoff
    const shouldLock = effectiveAttemptCount >= config.maxAttempts;
    const newConsecutiveLockouts = shouldLock
      ? rateLimit.consecutiveLockouts + 1
      : rateLimit.consecutiveLockouts;

    const lockoutDuration = shouldLock
      ? calculateLockoutDuration(
          config.baseLockoutMinutes,
          config.maxLockoutMinutes,
          rateLimit.consecutiveLockouts,
        )
      : 0;

    const lockoutUntil = shouldLock
      ? new Date(now.getTime() + lockoutDuration * 60 * 1000)
      : null;

    // Check if CAPTCHA should be triggered
    const shouldTriggerCaptcha =
      effectiveAttemptCount >= config.captchaTriggerAttempts ||
      rateLimit.requiresCaptcha;

    await prisma.rateLimitAttempt.update({
      where: { id: rateLimit.id },
      data: {
        attemptCount: effectiveAttemptCount,
        lastAttempt: now,
        lockedUntil: lockoutUntil,
        consecutiveLockouts: newConsecutiveLockouts,
        requiresCaptcha: shouldTriggerCaptcha,
      },
    });

    if (shouldLock) {
      await logSecurityEvent("lockout_triggered", undefined, undefined, {
        identifier,
        actionType,
        lockoutDuration,
        consecutiveLockouts: newConsecutiveLockouts,
      });
    }

    if (shouldTriggerCaptcha && !rateLimit.requiresCaptcha) {
      await logSecurityEvent("captcha_triggered", undefined, undefined, {
        identifier,
        actionType,
        attemptCount: effectiveAttemptCount,
      });
    }

    return { requiresCaptcha: shouldTriggerCaptcha };
  } catch (error) {
    // If database error, check if it's because tables don't exist
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTableMissing = 
      errorMessage.includes("does not exist") ||
      errorMessage.includes("Unknown model") ||
      errorMessage.includes("rateLimitAttempt");
    
    if (isTableMissing) {
      console.warn(
        "⚠️ Rate limiting tables not found. Run: npx prisma migrate dev",
      );
      // For development: use in-memory fallback to test CAPTCHA
      // This is NOT secure for production - you MUST run the migration
      return { requiresCaptcha: true }; // Always require CAPTCHA as fallback
    }
    
    console.error("Failed to record attempt:", error);
    return { requiresCaptcha: false };
  }
}

/**
 * Clear rate limit records for successful authentication
 * This prevents legitimate users from being locked out
 */
export async function clearRateLimit(
  identifier: string,
  actionType: RateLimitAction,
): Promise<void> {
  try {
    await prisma.rateLimitAttempt.deleteMany({
      where: {
        identifier,
        actionType,
      },
    });
  } catch (error) {
    // If database error, just log and continue
    console.error("Failed to clear rate limit:", error);
  }
}

/**
 * Check rate limit for both IP and email (whichever is more restrictive)
 */
export async function checkRateLimitDual(
  email: string,
  actionType: RateLimitAction,
): Promise<{
  allowed: boolean;
  errorMessage?: string;
  retryAfter?: number;
  requiresCaptcha: boolean;
}> {
  const ip = await getClientIP();

  // Check both IP and email rate limits
  const [ipCheck, emailCheck] = await Promise.all([
    checkRateLimit(ip, actionType),
    checkRateLimit(email.toLowerCase(), actionType),
  ]);

  // Combine CAPTCHA requirements (either triggers it)
  const requiresCaptcha = ipCheck.requiresCaptcha || emailCheck.requiresCaptcha;

  // If either is blocked, return the more restrictive error
  if (!ipCheck.allowed || !emailCheck.allowed) {
    // Return the one with longer retry time, or IP if equal
    if (!ipCheck.allowed && !emailCheck.allowed) {
      const result =
        ipCheck.retryAfter &&
        emailCheck.retryAfter &&
        ipCheck.retryAfter >= emailCheck.retryAfter
          ? ipCheck
          : emailCheck;
      return { ...result, requiresCaptcha };
    }
    const result = ipCheck.allowed ? emailCheck : ipCheck;
    return { ...result, requiresCaptcha };
  }

  return { allowed: true, requiresCaptcha };
}

/**
 * Record failed attempt for both IP and email
 */
export async function recordFailedAttemptDual(
  email: string,
  actionType: RateLimitAction,
): Promise<{ requiresCaptcha: boolean }> {
  const ip = await getClientIP();

  const [ipResult, emailResult] = await Promise.all([
    recordFailedAttempt(ip, actionType),
    recordFailedAttempt(email.toLowerCase(), actionType),
  ]);

  return {
    requiresCaptcha: ipResult.requiresCaptcha || emailResult.requiresCaptcha,
  };
}

/**
 * Clear rate limit for both IP and email
 */
export async function clearRateLimitDual(
  email: string,
  actionType: RateLimitAction,
): Promise<void> {
  const ip = await getClientIP();

  await Promise.all([
    clearRateLimit(ip, actionType),
    clearRateLimit(email.toLowerCase(), actionType),
  ]);
}

/**
 * Add artificial delay to normalize response timing
 * Prevents timing attacks that could reveal user existence
 */
export async function normalizeResponseTiming(
  startTime: number,
  minDurationMs: number = 500,
): Promise<void> {
  const elapsed = Date.now() - startTime;
  if (elapsed < minDurationMs) {
    await new Promise((resolve) =>
      setTimeout(resolve, minDurationMs - elapsed),
    );
  }
}

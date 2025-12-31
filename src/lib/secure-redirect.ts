/**
 * Get secure site URL for redirects (server-only)
 *
 * Security requirements:
 * - Must be HTTPS in production
 * - Must be set via server-only environment variable
 * - Fails closed if misconfigured
 * - Only allows localhost fallback in development
 *
 * Note: This is a server-only utility function (not a server action).
 * It's safe to use in server actions and server components.
 *
 * @throws {Error} If called from client-side code
 */
export function getSecureSiteUrl(): string {
  // Runtime guard: prevent accidental client-side usage
  if (typeof window !== "undefined") {
    throw new Error(
      "getSecureSiteUrl() is a server-only function and cannot be called from client-side code. This function uses server-only environment variables and must only be used in server actions or server components.",
    );
  }

  const siteUrl = process.env.SITE_URL; // Server-only (not NEXT_PUBLIC_)
  const isProduction = process.env.NODE_ENV === "production";
  const isDevelopment = process.env.NODE_ENV === "development";

  // In production, SITE_URL must be set and must be HTTPS
  if (isProduction) {
    if (!siteUrl) {
      throw new Error(
        "SITE_URL environment variable is required in production. Please set it to your HTTPS domain (e.g., https://yourdomain.com)",
      );
    }

    try {
      const url = new URL(siteUrl);

      // Enforce HTTPS in production
      if (url.protocol !== "https:") {
        throw new Error(
          `SITE_URL must use HTTPS in production. Current: ${siteUrl}. Please set SITE_URL to an HTTPS URL (e.g., https://yourdomain.com)`,
        );
      }

      // Validate it's a proper URL
      if (!url.hostname) {
        throw new Error(
          `SITE_URL must be a valid URL with a hostname. Current: ${siteUrl}`,
        );
      }

      return siteUrl;
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(
          `SITE_URL must be a valid URL. Current: ${siteUrl}. Please set SITE_URL to a valid URL (e.g., https://yourdomain.com)`,
        );
      }
      throw error;
    }
  }

  // In development, allow localhost fallback
  if (isDevelopment) {
    if (siteUrl) {
      try {
        const url = new URL(siteUrl);
        // In dev, allow http://localhost
        return siteUrl;
      } catch {
        // If invalid URL, fall back to localhost
        return "http://localhost:3000";
      }
    }
    return "http://localhost:3000";
  }

  // For other environments (test, etc.), require explicit setting
  if (!siteUrl) {
    throw new Error(
      "SITE_URL environment variable is required. Please set it to your site URL (e.g., https://yourdomain.com or http://localhost:3000 for development)",
    );
  }

  return siteUrl;
}

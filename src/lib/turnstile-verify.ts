"use server";

/**
 * Verify Turnstile CAPTCHA token server-side with Cloudflare
 * Returns true if token is valid, false otherwise
 */
export async function verifyTurnstileToken(
  token: string,
  remoteip?: string,
): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.warn("TURNSTILE_SECRET_KEY not configured - skipping verification");
    // In development, allow if secret key not set (but warn)
    return process.env.NODE_ENV !== "production";
  }

  if (!token) {
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteip) {
      formData.append("remoteip", remoteip);
    }

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      },
    );

    const result = await response.json();

    // Turnstile returns { success: true/false, ... }
    if (!result.success) {
      console.warn("Turnstile verification failed:", result);
    }
    return result.success === true;
  } catch (error) {
    console.error("Turnstile verification error:", error);
    // Fail closed - if verification fails, reject the request
    return false;
  }
}


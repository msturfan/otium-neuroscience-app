"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { resetPasswordAction } from "@/actions/users";
import TurnstileCaptcha from "./TurnstileCaptcha";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requiresCaptcha, setRequiresCaptcha] = useState(true); // Always require CAPTCHA for password reset
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  const handleCaptchaError = useCallback(() => {
    setCaptchaToken(null);
    setErrorMessage("CAPTCHA verification failed. Please try again.");
  }, []);

  const handleCaptchaExpire = useCallback(() => {
    setCaptchaToken(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setErrorMessage(null);

    // Check if CAPTCHA is required but not verified
    if (requiresCaptcha && !captchaToken) {
      setErrorMessage("Please complete the CAPTCHA verification.");
      setLoading(false);
      return;
    }

    try {
      const result = await resetPasswordAction(
        email,
        captchaToken || undefined,
      );

      if (result.errorMessage) {
        setErrorMessage(result.errorMessage);
      } else if (result.success && result.message) {
        setMessage(result.message);
      } else {
        setMessage(
          "If an account exists for that email, a reset link has been sent.",
        );
      }

      // Update CAPTCHA requirement based on server response
      if (result.requiresCaptcha) {
        setRequiresCaptcha(true);
        setCaptchaToken(null); // Reset token for next attempt
      }
    } catch {
      // Fallback message to prevent email enumeration
      setMessage(
        "If an account exists for that email, a reset link has been sent.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          id="email"
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          inputMode="email"
        />
      </div>

      {requiresCaptcha && (
        <div className="flex justify-center">
          <TurnstileCaptcha
            onVerify={handleCaptchaVerify}
            onError={handleCaptchaError}
            onExpire={handleCaptchaExpire}
          />
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !email || (requiresCaptcha && !captchaToken)}
      >
        {loading ? "Sending..." : "Send reset link"}
      </Button>

      {errorMessage && (
        <p className="text-destructive text-center text-sm">{errorMessage}</p>
      )}
      {message && (
        <p className="text-muted-foreground text-center text-sm">{message}</p>
      )}

      <div className="mt-2 text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Back to login
        </Link>
      </div>
    </form>
  );
}

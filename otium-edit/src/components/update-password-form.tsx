"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      const url = new URL(window.location.href);
      const hasCode = url.searchParams.get("code");
      const hasHashToken = url.hash.includes("access_token");

      if (hasCode) {
        try {
          await supabase.auth.exchangeCodeForSession(window.location.href);
        } catch {
        } finally {
          url.searchParams.delete("code");
          window.history.replaceState({}, "", url.pathname);
        }
      }

      if (hasHashToken) {
        window.history.replaceState({}, "", url.pathname);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
          if (s) setSessionChecked(true);
        });
        unsub = sub?.subscription?.unsubscribe ?? (() => {});
        setTimeout(async () => {
          const {
            data: { session: s2 },
          } = await supabase.auth.getSession();
          if (!s2) {
            router.replace("/forgot-password");
          } else {
            setSessionChecked(true);
          }
        }, 800);
      } else {
        setSessionChecked(true);
      }
    })();

    return () => unsub();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords don't match");
      setIsSuccess(false);
      return;
    }
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters");
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage(error.message);
        setIsSuccess(false);
      } else {
        setMessage("Password updated. Redirecting to login…");
        setIsSuccess(true);
        await supabase.auth.signOut().catch(() => {});
        setTimeout(() => router.push("/login"), 1000);
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (!sessionChecked) return null;

  // Form only (no container/card) so the page can control layout and match Forgot Password styling
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="password" className="sr-only">
          New Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      <div>
        <Label htmlFor="confirmPassword" className="sr-only">
          Confirm Password
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !password || !confirmPassword}
      >
        {loading ? "Updating..." : "Update password"}
      </Button>

      {message && (
        <p
          className={`text-center text-sm ${isSuccess ? "text-green-600" : "text-red-600"}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}

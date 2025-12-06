"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

function LoginToaster() {
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified");
  const error = searchParams.get("error");
  const shownToastsRef = useRef<Set<string>>(new Set());

  const removeUrlParam = (param: string) => {
    const newSearchParams = new URLSearchParams(window.location.search);
    newSearchParams.delete(param);
    const newUrl = `${window.location.pathname}${newSearchParams.toString() ? `?${newSearchParams}` : ""}`;
    window.history.replaceState({}, "", newUrl);
  };

  useEffect(() => {
    if (verified === "true") {
      if (shownToastsRef.current.has("verified")) {
        removeUrlParam("verified");
        return;
      }

      shownToastsRef.current.add("verified");
      toast.success("Email verified!", {
        description: "Your email has been verified. You can now log in.",
      });

      removeUrlParam("verified");

      setTimeout(() => {
        shownToastsRef.current.delete("verified");
      }, 1000);
    }

    if (error === "verification_failed") {
      if (shownToastsRef.current.has("error")) {
        removeUrlParam("error");
        return;
      }

      shownToastsRef.current.add("error");
      toast.error("Verification failed", {
        description:
          "The verification link is invalid or has expired. Please try signing up again.",
      });

      removeUrlParam("error");

      setTimeout(() => {
        shownToastsRef.current.delete("error");
      }, 1000);
    }
  }, [verified, error]);

  return null;
}

export default LoginToaster;

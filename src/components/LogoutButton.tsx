"use client";

import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { logOutAction } from "@/actions/users";

function LogOutButton() {
  const [loading, setLoading] = useState(false);

  const clearLocalConversationCache = () => {
    if (typeof window === "undefined") return;

    try {
      const removablePrefixes = [
        "ai-greetings-",
        "chat-neuro-",
        "chat-workout-",
      ];
      for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
        const key = sessionStorage.key(i);
        if (!key) continue;
        if (removablePrefixes.some((prefix) => key.startsWith(prefix))) {
          sessionStorage.removeItem(key);
        }
      }
    } catch {
      // Ignore storage failures.
    }
  };

  const handleLogOut = async () => {
    setLoading(true);

    const { errorMessage } = await logOutAction();

    if (!errorMessage) {
      clearLocalConversationCache();
      window.location.assign("/?toastType=logOut");
    } else {
      toast("Error", {
        description: errorMessage,
      });
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleLogOut}
      disabled={loading}
      className="w-24"
    >
      {loading ? <Loader2 className="animate-spin" /> : "Log Out"}
    </Button>
  );
}

export default LogOutButton;

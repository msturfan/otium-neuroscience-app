"use client";

import * as React from "react";
import { Link, LogOut, MoreHorizontal, Pin, Settings2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { logOutAction } from "@/actions/users";
import NextLink from "next/link";
import type { User } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import DarkModeToggle from "./DarkModeToggle";
import { usePinnedChats } from "@/hooks/usePinnedChats";

const data = [
  [
    {
      label: "Customize Page",
      icon: Settings2,
    },
  ],
  [
    {
      label: "Copy Link",
      icon: Link,
    },
    {
      label: "Pin chat",
      icon: Pin,
      pinAction: true as const,
    },
  ],
  [
    {
      label: "Log Out",
      icon: LogOut,
    },
  ],
];

export function NavActions({ user }: { user: User | null }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const noteId = searchParams.get("noteId");

  const isNotesContext =
    pathname === "/" || pathname.startsWith("/neuroplasticity");
  const isNeuroscience = pathname.startsWith("/neuroplasticity");
  const { togglePin, isPinned } = usePinnedChats(isNeuroscience);

  React.useEffect(() => {
    setIsOpen(false);
  }, []);

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== "undefined" && "clipboard" in navigator) {
        await navigator.clipboard.writeText(window.location.href);
      } else {
        const ta = document.createElement("textarea");
        ta.value = window.location.href;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      toast("Copied link", { description: "Page URL copied to clipboard." });
    } catch (err) {
      toast("Couldn't copy link", {
        description:
          err instanceof Error ? err.message : "Copy failed. Try again.",
      });
    } finally {
      setIsOpen(false);
    }
  };

  const handlePinChat = () => {
    if (!noteId) {
      toast("No chat open", {
        description: "Open a note first, then you can pin it to the sidebar.",
      });
      return;
    }
    if (!isNotesContext) {
      toast("Pin unavailable", {
        description: "Pinning is only available on Otium or Neuroscience notes.",
      });
      return;
    }
    const wasPinned = isPinned(noteId);
    togglePin(noteId);
    toast(wasPinned ? "Chat unpinned" : "Chat pinned", {
      description: wasPinned
        ? "Removed from pinned in the sidebar."
        : "Shown at the top of your sidebar list.",
    });
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);

    const { errorMessage } = await logOutAction();

    if (!errorMessage) {
      router.push(`/?toastType=logOut`);
    } else {
      toast("Error", {
        description: errorMessage,
      });
    }

    setIsLoggingOut(false);
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      {user ? (
        <>
          <DarkModeToggle />
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="data-[state=open]:bg-accent h-7 w-7"
              >
                <MoreHorizontal />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-56 overflow-hidden rounded-lg p-0"
              align="end"
            >
              <Sidebar collapsible="none" className="bg-transparent">
                <SidebarContent>
                  {data.map((group, index) => (
                    <SidebarGroup
                      key={index}
                      className="border-b last:border-none"
                    >
                      <SidebarGroupContent className="gap-0">
                        <SidebarMenu>
                          {group.map((item, itemIndex) => {
                            const pinLabel =
                              noteId && isPinned(noteId)
                                ? "Unpin chat"
                                : "Pin chat";
                            const displayLabel = item.pinAction
                              ? pinLabel
                              : item.label;

                            return (
                              <SidebarMenuItem key={itemIndex}>
                                <SidebarMenuButton
                                  onClick={
                                    item.label === "Log Out"
                                      ? handleSignOut
                                      : item.label === "Copy Link"
                                        ? handleCopyLink
                                        : item.pinAction
                                          ? handlePinChat
                                          : undefined
                                  }
                                  disabled={
                                    item.label === "Log Out" && isLoggingOut
                                  }
                                >
                                  <item.icon /> <span>{displayLabel}</span>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            );
                          })}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </SidebarGroup>
                  ))}
                </SidebarContent>
              </Sidebar>
            </PopoverContent>
          </Popover>
        </>
      ) : (
        <>
          <Button asChild variant="outline" size="sm">
            <NextLink href="/login">Log In</NextLink>
          </Button>
          <Button asChild size="sm">
            <NextLink href="/sign-up">Sign Up</NextLink>
          </Button>
          <DarkModeToggle />
        </>
      )}
    </div>
  );
}

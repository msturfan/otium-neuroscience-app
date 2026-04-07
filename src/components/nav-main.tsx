"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type LucideIcon } from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { isNewNoteNavActive } from "@/lib/note-nav";

export function NavMain({
  items,
  knownNoteIds,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
  }[];
  /** IDs currently shown under My Notes / Neuroscience; used so `/?noteId=` does not keep "New Chat" highlighted. */
  knownNoteIds: Set<string> | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const noteId = searchParams.get("noteId");
  const [showInProgress, setShowInProgress] = useState(false);

  const isItemActive = (url: string, itemTitle: string) => {
    if (itemTitle === "New Chat") {
      return isNewNoteNavActive(pathname, noteId, knownNoteIds);
    }
    // Handle root path - other items: avoid matching every `/?noteId=` as "/"
    if (url === "/") {
      return pathname === "/" && !noteId;
    }
    // Handle hash/anchor links - never active
    if (url === "#") {
      return false;
    }
    // For other paths, check if pathname starts with the URL
    return pathname.startsWith(url);
  };

  const handleNewNoteClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const newId = crypto.randomUUID();
    
    if (pathname.startsWith("/neuroplasticity")) {
      router.push(`/neuroplasticity?noteId=${newId}`);
    } else if (pathname.startsWith("/workout")) {
      router.push(`/workout?noteId=${newId}`);
    } else {
      router.push(`/?noteId=${newId}`);
    }
  };

  const handleCreateWorkoutProgramClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    e.preventDefault();
    setShowInProgress(true);
  };

  useEffect(() => {
    if (!showInProgress) return;
    const timeout = window.setTimeout(() => {
      setShowInProgress(false);
    }, 1400);

    return () => window.clearTimeout(timeout);
  }, [showInProgress]);

  const isWorkoutRoute = pathname.startsWith("/workout");
  const hideInbox = pathname.startsWith("/neuroplasticity") || isWorkoutRoute;
  const navItems = items.filter((item) => {
    if (hideInbox && item.url === "/inbox") return false;
    if (item.title === "Workout Program" && !isWorkoutRoute) return false;
    return true;
  });

  return (
    <>
      <SidebarMenu>
        {navItems.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild isActive={isItemActive(item.url, item.title)}>
              {item.title === "New Chat" ? (
                <a href={item.url} onClick={handleNewNoteClick}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              ) : item.title === "Workout Program" ? (
                <a href={item.url} onClick={handleCreateWorkoutProgramClick}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              ) : (
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      {showInProgress ? (
        <div className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="rounded-md bg-black/80 px-4 py-2 text-sm font-medium text-white shadow-lg">
            In progress
          </div>
        </div>
      ) : null}
    </>
  );
}

"use client";

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

  const hideInbox =
    pathname.startsWith("/neuroplasticity") || pathname.startsWith("/workout");
  const navItems = hideInbox ? items.filter((item) => item.url !== "/inbox") : items;

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={isItemActive(item.url, item.title)}>
            {item.title === "New Chat" ? (
              <a href={item.url} onClick={handleNewNoteClick}>
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
  );
}

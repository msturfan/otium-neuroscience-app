"use client";

import { usePathname, useRouter } from "next/navigation";
import { type LucideIcon } from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
  }[];
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isItemActive = (url: string) => {
    // Handle root path - only active when pathname is exactly "/"
    if (url === "/") {
      return pathname === "/";
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
    
    // If on neuroplasticity page, create new neuroplasticity note
    if (pathname.startsWith("/neuroplasticity")) {
      router.push(`/neuroplasticity?noteId=${newId}`);
    } else {
      // Otherwise, create new regular note
      router.push(`/?noteId=${newId}`);
    }
  };

  const isNeuroplasticity = pathname.startsWith("/neuroplasticity");
  const navItems = isNeuroplasticity
    ? items.filter((item) => item.url !== "/inbox")
    : items;

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={isItemActive(item.url)}>
            {item.title === "New note" ? (
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

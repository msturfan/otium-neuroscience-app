"use client";

import { usePathname } from "next/navigation";
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

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={isItemActive(item.url)}>
            <a href={item.url}>
              <item.icon />
              <span>{item.title}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

"use client";

import * as React from "react";
import Image from "next/image";
import {
  AudioWaveform,
  Calendar,
  Command,
  Home,
  Inbox,
  MessageCircleQuestion,
  Settings2,
  Sparkles,
} from "lucide-react";

import { NavNotes } from "@/components/nav-notes";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import { SearchCommand } from "@/components/SearchCommand";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { User } from "@supabase/supabase-js";

// Custom logo component for Otium
const OtiumLogo = ({ className }: { className?: string }) => (
  <div className={className}>
    <Image
      src="/appicon1.ico"
      alt="Otium"
      width={20}
      height={20}
      className="h-full w-full"
    />
  </div>
);

// This is sample data.
const data = {
  user: {
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "https://github.com/shadcn.png",
  },
  teams: [
    {
      name: "Otium",
      logo: OtiumLogo,
      plan: "Enterprise",
    },
    {
      name: "Coming Soon...",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Coming Soon...",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Ask AI",
      url: "#",
      icon: Sparkles,
    },
    {
      title: "Home",
      url: "/",
      icon: Home,
      isActive: true,
    },
    {
      title: "Inbox",
      url: "#",
      icon: Inbox,
      badge: "10",
    },
  ],
  navSecondary: [
    {
      title: "Calendar",
      url: "#",
      icon: Calendar,
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
    },
    {
      title: "Help",
      url: "/help",
      icon: MessageCircleQuestion,
    },
  ],
};

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: User | null }) {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        <div className="flex flex-col gap-2">
          <SearchCommand />
          <NavMain items={data.navMain} />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavNotes user={user} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

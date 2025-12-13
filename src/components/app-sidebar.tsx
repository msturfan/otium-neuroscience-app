"use client";

import * as React from "react";
import Image from "next/image";
import {
  AudioWaveform,
  Calendar,
  Command,
  Notebook,
  Edit,
  Inbox,
  MessageCircleQuestion,
  Settings2,
  Sparkles,
  QuoteIcon,
  ScrollText,
  Landmark,
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
import { IconQuoteFilled } from "@tabler/icons-react";

// Custom logo component for Otium
const OtiumLogo = ({ className }: { className?: string }) => (
  <div className={className}>
    <Image
      src="/appicon1.ico"
      alt="Otium"
      width={24}
      height={24}
      className="h-full w-full object-contain"
    />
  </div>
);

const NeuroplasticityLogo = ({ className }: { className?: string }) => (
  <div className={className}>
    <Image
      src="/neuroplasticity-logo.png"
      alt="Neuroplasticity"
      width={24}
      height={24}
      className="h-full w-full object-contain"
    />
  </div>
);

type UserProfile = {
  name: string;
  email: string;
  avatar: string;
  initials: string;
} | null;

// This is sample data.
const data = {
  teams: [
    {
      name: "Otium",
      logo: OtiumLogo,
      plan: "Enterprise",
      url: "/",
      isActive: true,
    },
    {
      name: "Neuroplasticity",
      logo: NeuroplasticityLogo,
      plan: "Startup",
      url: "/neuroplasticity",
      isActive: true,
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
      title: "New note",
      url: "/",
      icon: Edit,
      isActive: true,
    },
    {
      title: "Inbox",
      url: "/inbox",
      icon: Inbox,
      badge: "10",
    },
  ],
  navSecondary: [
    {
      title: "Daily Quote",
      url: "/quote",
      icon: Landmark,
    },
    {
      title: "Calendar",
      url: "/calendar",
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
  userProfile,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: User | null;
  userProfile: UserProfile;
}) {
  // Use real user profile if available, otherwise use fallback
  const displayUser = userProfile || {
    name: user?.email || "Guest",
    email: user?.email || "",
    avatar:
      "https://ui-avatars.com/api/?name=Guest&background=000000&color=ffffff&size=128&bold=true",
    initials: user?.email?.[0].toUpperCase() || "G",
  };

  // Filter navSecondary to only show Calendar for logged-in users
  const navSecondaryFiltered = user
    ? data.navSecondary
    : data.navSecondary.filter((item) => item.title !== "Calendar");

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
        <NavSecondary items={navSecondaryFiltered} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={displayUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

"use client";

import * as React from "react";
import Image from "next/image";
import {
  Brain,
  Calendar,
  Dumbbell,
  Edit,
  Inbox,
  Landmark,
  HeartHandshake,
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
import { useKnownNoteIds } from "@/providers/KnownNoteIdsProvider";

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

export const NeuroplasticityLogo = ({ className }: { className?: string }) => (
  <Brain className={className} />
);

export const WorkoutLogo = ({ className }: { className?: string }) => (
  <Dumbbell className={className} />
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
      name: "Workout",
      logo: WorkoutLogo,
      plan: "Free",
      url: "/workout",
      isActive: true,
    },
  ],
  navMain: [
    {
      title: "New note",
      url: "/",
      icon: Edit,
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
      title: "Meditation",
      url: "/meditation",
      icon: HeartHandshake,
    },
    {
      title: "Calendar",
      url: "/calendar",
      icon: Calendar,
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

  // Filter navSecondary to only show Calendar and Settings for logged-in users
  const navSecondaryFiltered = user
    ? data.navSecondary
    : data.navSecondary.filter(
        (item) => item.title !== "Calendar" && item.title !== "Settings"
      );

  const { knownNoteIds, setKnownNoteIds } = useKnownNoteIds();

  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} user={user} />
        <div className="flex flex-col gap-2">
          <SearchCommand />
          <NavMain items={data.navMain} knownNoteIds={knownNoteIds} />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavNotes user={user} onKnownNoteIdsChange={setKnownNoteIds} />
        <NavSecondary items={navSecondaryFiltered} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={displayUser} isGuest={!user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

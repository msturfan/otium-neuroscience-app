"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, Plus } from "lucide-react";
import { User } from "@supabase/supabase-js";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function TeamSwitcher({
  teams,
  user,
}: {
  teams: {
    name: string;
    logo: React.ElementType;
    plan: string;
    url?: string;
  }[];
  user: User | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [activeTeam, setActiveTeam] = React.useState(() => {
    // Initial state based on current pathname
    const matchingTeam = teams.find((team) => {
      if (!team.url) return false;
      if (team.url === "/") {
        return pathname === "/";
      }
      return pathname.startsWith(team.url);
    });
    return matchingTeam || teams[0];
  });

  // Update active team when pathname changes
  React.useEffect(() => {
    const matchingTeam = teams.find((team) => {
      if (!team.url) return false;
      if (team.url === "/") {
        return pathname === "/";
      }
      return pathname.startsWith(team.url);
    });
    const newActiveTeam = matchingTeam || teams[0];
    setActiveTeam(newActiveTeam);
  }, [pathname, teams]);

  if (!activeTeam) {
    return null;
  }

  const handleTeamClick = (team: typeof teams[0], e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (team.url) {
      // If guest user tries to access neuroplasticity, redirect to signup
      if (team.url === "/neuroplasticity" && !user) {
        router.push("/sign-up");
        return;
      }
      
      // For neuroplasticity, always include a noteId to avoid redirect
      // Use push instead of replace to ensure navigation happens
      if (team.url === "/neuroplasticity") {
        const newId = crypto.randomUUID();
        router.push(`/neuroplasticity?noteId=${newId}`);
      } else if (team.url === "/") {
        // For home page, also ensure we navigate with a noteId
        const newId = crypto.randomUUID();
        router.push(`/?noteId=${newId}`);
      } else {
        router.push(team.url);
      }
      
      // Update active team
      setActiveTeam(team);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="w-fit px-1.5">
              <div className="flex aspect-square size-5 items-center justify-center rounded-full overflow-hidden">
                <activeTeam.logo className="size-full" />
              </div>
              <span className="truncate font-medium">{activeTeam.name}</span>
              <ChevronDown className="opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Teams
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={(e) => handleTeamClick(team, e)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-full border overflow-hidden">
                  <team.logo className="size-full shrink-0" />
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Add team</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

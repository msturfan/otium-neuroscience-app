"use client";

import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { useOptionalWorkoutProfileEditor } from "@/providers/WorkoutProfileEditorProvider";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getWorkoutProgramLogoDefinition } from "@/lib/workout/workoutProgramLogos";

type Props = {
  user: User | null;
};

export function NavWorkoutProgramProfile({ user }: Props) {
  const pathname = usePathname();
  const ctx = useOptionalWorkoutProfileEditor();

  const isWorkout = pathname.startsWith("/workout");
  const show =
    ctx &&
    isWorkout &&
    user &&
    ctx.onWorkoutPage &&
    ctx.workoutPageHasProfile;

  if (!show) return null;

  const { Icon } = getWorkoutProgramLogoDefinition(ctx.workoutProgramLogoId);

  return (
    <SidebarGroup className="p-0">
      <SidebarGroupContent className="border-b border-sidebar-border pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton type="button" onClick={ctx.requestEditProfile}>
              <Icon />
              <span>Program profile</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

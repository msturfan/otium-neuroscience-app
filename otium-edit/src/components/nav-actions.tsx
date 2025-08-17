"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  Bell,
  Copy,
  CornerUpLeft,
  CornerUpRight,
  FileText,
  GalleryVerticalEnd,
  LineChart,
  Link,
  LogOut,
  MoreHorizontal,
  Settings2,
} from "lucide-react";
import { useRouter } from "next/navigation";
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

const data = [
  [
    {
      label: "Customize Page",
      icon: Settings2,
    },
    {
      label: "Turn into wiki",
      icon: FileText,
    },
  ],
  [
    {
      label: "Copy Link",
      icon: Link,
    },
  ],
  [
    {
      label: "View analytics",
      icon: LineChart,
    },
    {
      label: "Version History",
      icon: GalleryVerticalEnd,
    },
    {
      label: "Notifications",
      icon: Bell,
    },
  ],
  [
    {
      label: "Import",
      icon: ArrowUp,
    },
    {
      label: "Export",
      icon: ArrowDown,
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

  React.useEffect(() => {
    setIsOpen(false);
  }, []);

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
                          {group.map((item, index) => (
                            <SidebarMenuItem key={index}>
                              <SidebarMenuButton
                                onClick={
                                  item.label === "Log Out"
                                    ? handleSignOut
                                    : undefined
                                }
                                disabled={
                                  item.label === "Log Out" && isLoggingOut
                                }
                              >
                                <item.icon /> <span>{item.label}</span>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
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

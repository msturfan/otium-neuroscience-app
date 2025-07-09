"use client";

import {
  ArrowUpRight,
  Link,
  MoreHorizontal,
  StarOff,
  Trash2,
  Loader2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useTransition, useRef, useEffect } from "react";

export function NavFavorites({
  favorites,
  onDelete,
}: {
  favorites: {
    id: string;
    name: string;
    url: string;
    emoji: string;
  }[];
  onDelete?: (id: string) => Promise<void>;
}) {
  const { isMobile } = useSidebar();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<{ [key: string]: boolean }>(
    {},
  );
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  const handleDelete = () => {
    if (selectedItemId && onDelete) {
      startTransition(async () => {
        await onDelete(selectedItemId);
        setDialogOpen(false);
      });
    }
  };

  const handleDeleteClick = (id: string) => {
    setSelectedItemId(id);
    setDialogOpen(true);
    setDropdownOpen((prev) => ({ ...prev, [id]: false }));
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setSelectedItemId(null);
  };

  useEffect(() => {
    if (dialogOpen && deleteButtonRef.current) {
      setTimeout(() => {
        deleteButtonRef.current?.focus();
      }, 100);
    }
  }, [dialogOpen]);

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Favorites</SidebarGroupLabel>
        <SidebarMenu>
          {favorites.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton asChild>
                <a href={item.url} title={item.name}>
                  <span>{item.emoji}</span>
                  <span>{item.name}</span>
                </a>
              </SidebarMenuButton>
              <DropdownMenu
                open={dropdownOpen[item.id] || false}
                onOpenChange={(open) =>
                  setDropdownOpen((prev) => ({ ...prev, [item.id]: open }))
                }
              >
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem>
                    <StarOff className="text-muted-foreground" />
                    <span>Remove from Favorites</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link className="text-muted-foreground" />
                    <span>Copy Link</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <ArrowUpRight className="text-muted-foreground" />
                    <span>Open in New Tab</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      handleDeleteClick(item.id);
                    }}
                  >
                    <Trash2 className="text-muted-foreground" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton className="text-sidebar-foreground/70">
              <MoreHorizontal />
              <span>More</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onPointerDownOutside={handleCancel}>
          <DialogHeader>
            <DialogTitle>
              Are you sure you want to delete this item?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete this
              item from your favorites.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              tabIndex={-1}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              ref={deleteButtonRef}
              onClick={handleDelete}
              className="w-24 bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
              autoFocus
            >
              {isPending ? <Loader2 className="animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

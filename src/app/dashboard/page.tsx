import { AppSidebar } from "@/components/app-sidebar";
import { NavActions } from "@/components/nav-actions";
import { KnownNoteIdsProvider } from "@/providers/KnownNoteIdsProvider";
import { DateDisplay } from "@/components/DateDisplay";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getUser } from "@/auth/server";
import { getUserProfile } from "@/lib/user-utils";

export default async function Page() {
  const user = await getUser();
  const userProfile = await getUserProfile(user);

  return (
    <SidebarProvider>
      <KnownNoteIdsProvider>
        <AppSidebar user={user} userProfile={userProfile} />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center justify-between">
            <div className="flex items-center gap-2 px-3">
              <SidebarTrigger />
              <Separator
                orientation="vertical"
                className="mx-2 data-[orientation=vertical]:h-4"
              />
              <DateDisplay />
            </div>
            <div className="px-3">
              <NavActions user={user} />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 px-4 py-10">
            <div className="bg-muted/50 mx-auto h-24 w-full max-w-3xl rounded-xl" />
            <div className="bg-muted/50 mx-auto h-full w-full max-w-3xl rounded-xl" />
          </div>
        </SidebarInset>
      </KnownNoteIdsProvider>
    </SidebarProvider>
  );
}

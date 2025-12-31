import { getUser } from "@/auth/server";
import { redirect } from "next/navigation";
import InboxDisplay from "./InboxDisplay";
import { getInboxData } from "@/actions/inbox";

export default async function InboxPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login?redirect=/inbox");
  }

  const inboxData = await getInboxData();

  return <InboxDisplay userEmail={user.email} initialData={inboxData} />;
}
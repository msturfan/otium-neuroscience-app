import { getUser } from "@/auth/server";
import { redirect } from "next/navigation";
import InboxDisplay from "./InboxDisplay";

export default async function InboxPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login?redirect=/inbox");
  }

  return <InboxDisplay userEmail={user.email} />;
}
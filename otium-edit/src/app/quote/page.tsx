import { getUser } from "@/auth/server";
import { redirect } from "next/navigation";
import QuoteDisplay from "./QuoteDisplay";

export default async function QuotePage() {
  const user = await getUser();

  if (!user) {
    redirect("/login?redirect=/quote");
  }

  return <QuoteDisplay userEmail={user.email} />;
}
import { getUser } from "@/auth/server";
import { redirect } from "next/navigation";
import MeditationDisplay from "./MeditationDisplay";

export default async function MeditationPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login?redirect=/meditation");
  }

  return <MeditationDisplay />;
}

import { getUser } from "@/auth/server";
import { redirect } from "next/navigation";
import { prisma } from "@/db/prisma";
import CalendarDisplay from "./CalendarDisplay";

export default async function CalendarPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login?redirect=/calendar");
  }

  // Fetch user's DOB from database
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { dob: true },
  });

  if (!userData?.dob) {
    // User doesn't have DOB set, redirect to settings or show message
    redirect("/?error=no-dob");
  }

  return <CalendarDisplay birthdate={userData.dob} />;
}

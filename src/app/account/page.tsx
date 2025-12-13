import { getUser } from "@/auth/server";
import { redirect } from "next/navigation";
import { prisma } from "@/db/prisma";
import AccountDisplay from "./AccountDisplay";

export default async function AccountPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login?redirect=/account");
  }

  // Fetch user profile from database
  const userProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  if (!userProfile) {
    redirect("/login?redirect=/account");
  }

  return (
    <AccountDisplay
      initialFirstName={userProfile.firstName}
      initialLastName={userProfile.lastName}
      initialEmail={userProfile.email}
    />
  );
}


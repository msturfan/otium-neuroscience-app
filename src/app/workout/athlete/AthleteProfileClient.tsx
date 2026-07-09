"use client";

import { useRouter } from "next/navigation";
import WorkoutProgramProfileForm from "@/components/workout/WorkoutProgramProfileForm";
import type { WorkoutProgramProfile } from "@/lib/types/workout";

type Props = {
  initialProfile: WorkoutProgramProfile;
  mode: "create" | "edit";
};

export default function AthleteProfileClient({ initialProfile, mode }: Props) {
  const router = useRouter();

  const handleComplete = () => {
    router.push("/workout");
    router.refresh();
  };

  const handleCancel = () => {
    router.push("/workout");
  };

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-start overflow-y-auto">
      <WorkoutProgramProfileForm
        mode={mode}
        initialData={initialProfile}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  );
}

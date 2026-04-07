"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

import { fetchWorkoutProfileAction } from "@/actions/workout-profile";
import { useWorkoutProfileEditor } from "@/providers/WorkoutProfileEditorProvider";
import {
  DEFAULT_WORKOUT_PROFILE,
  type WorkoutProgramProfile,
} from "@/lib/types/workout";

import WorkoutProgramProfileForm from "./WorkoutProgramProfileForm";

type Props = {
  children: React.ReactNode;
  hasProfile: boolean;
};

export default function WorkoutGate({ children, hasProfile }: Props) {
  const router = useRouter();
  const [profileComplete, setProfileComplete] = useState(hasProfile);

  useEffect(() => {
    if (hasProfile) setProfileComplete(true);
  }, [hasProfile]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editInitial, setEditInitial] = useState<WorkoutProgramProfile | null>(
    null,
  );
  const prevRequestId = useRef(0);

  const { editProfileRequestId, setWorkoutPageProfileState } =
    useWorkoutProfileEditor();

  useEffect(() => {
    setWorkoutPageProfileState({
      onWorkoutPage: true,
      hasProfile: profileComplete,
    });
    return () =>
      setWorkoutPageProfileState({ onWorkoutPage: false, hasProfile: false });
  }, [profileComplete, setWorkoutPageProfileState]);

  useEffect(() => {
    if (!profileComplete || editProfileRequestId === 0) return;
    if (prevRequestId.current === editProfileRequestId) return;
    prevRequestId.current = editProfileRequestId;

    void (async () => {
      const { profile } = await fetchWorkoutProfileAction();
      if (profile) {
        setEditInitial(profile);
        setIsEditingProfile(true);
      }
    })();
  }, [editProfileRequestId, profileComplete]);

  const handleProfileFormComplete = useCallback(() => {
    setProfileComplete(true);
    setIsEditingProfile(false);
    setEditInitial(null);
    router.refresh();
  }, [router]);

  const handleProfileFormCancelEdit = useCallback(() => {
    setIsEditingProfile(false);
    setEditInitial(null);
  }, []);

  const showProfileForm = !profileComplete || isEditingProfile;

  if (showProfileForm) {
    if (profileComplete && isEditingProfile && !editInitial) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-sm text-muted-foreground">
          Loading your profile…
        </div>
      );
    }

    return (
      <WorkoutProgramProfileForm
        mode={profileComplete ? "edit" : "create"}
        initialData={
          profileComplete && editInitial
            ? editInitial
            : DEFAULT_WORKOUT_PROFILE
        }
        onComplete={handleProfileFormComplete}
        onCancel={
          profileComplete ? handleProfileFormCancelEdit : undefined
        }
      />
    );
  }

  return <>{children}</>;
}

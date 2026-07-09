"use client";

import * as React from "react";

type WorkoutProfileEditorContextValue = {
  /** True while the workout program profile form is mounted (Save/Cancel live in the form). */
  workoutProfileFormOpen: boolean;
  setWorkoutProfileFormOpen: (open: boolean) => void;
  /** Incrementing signal so WorkoutGate can open the editor when user has a profile */
  requestEditProfile: () => void;
  editProfileRequestId: number;
  /** Set by WorkoutGate when the workout shell is active with/without a saved profile */
  setWorkoutPageProfileState: (state: {
    hasProfile: boolean;
    onWorkoutPage: boolean;
  }) => void;
  workoutPageHasProfile: boolean;
  onWorkoutPage: boolean;
  /** User-selected logo for Workout Program Profile UI. */
  workoutProgramLogoId: string;
  setWorkoutProgramLogoId: (id: string) => void;
};

const WorkoutProfileEditorContext =
  React.createContext<WorkoutProfileEditorContextValue | null>(null);

const WORKOUT_PROGRAM_LOGO_STORAGE_KEY = "otium.workout.programProfile.logoId";
const DEFAULT_WORKOUT_PROGRAM_LOGO_ID = "dumbbell";

export function WorkoutProfileEditorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [workoutProfileFormOpen, setWorkoutProfileFormOpenState] =
    React.useState(false);
  const [editProfileRequestId, setEditProfileRequestId] = React.useState(0);
  const [workoutPageHasProfile, setWorkoutPageHasProfile] = React.useState(false);
  const [onWorkoutPage, setOnWorkoutPage] = React.useState(false);
  const [workoutProgramLogoId, setWorkoutProgramLogoIdState] = React.useState(
    DEFAULT_WORKOUT_PROGRAM_LOGO_ID,
  );

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(WORKOUT_PROGRAM_LOGO_STORAGE_KEY);
      if (stored) setWorkoutProgramLogoIdState(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const setWorkoutProfileFormOpen = React.useCallback((open: boolean) => {
    setWorkoutProfileFormOpenState(open);
  }, []);

  const requestEditProfile = React.useCallback(() => {
    setEditProfileRequestId((n) => n + 1);
  }, []);

  const setWorkoutPageProfileState = React.useCallback(
    (state: { hasProfile: boolean; onWorkoutPage: boolean }) => {
      setWorkoutPageHasProfile(state.hasProfile);
      setOnWorkoutPage(state.onWorkoutPage);
    },
    [],
  );

  const setWorkoutProgramLogoId = React.useCallback((id: string) => {
    setWorkoutProgramLogoIdState(id);
    try {
      localStorage.setItem(WORKOUT_PROGRAM_LOGO_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const value = React.useMemo(
    () => ({
      workoutProfileFormOpen,
      setWorkoutProfileFormOpen,
      requestEditProfile,
      editProfileRequestId,
      setWorkoutPageProfileState,
      workoutPageHasProfile,
      onWorkoutPage,
      workoutProgramLogoId,
      setWorkoutProgramLogoId,
    }),
    [
      workoutProfileFormOpen,
      setWorkoutProfileFormOpen,
      requestEditProfile,
      editProfileRequestId,
      setWorkoutPageProfileState,
      workoutPageHasProfile,
      onWorkoutPage,
      workoutProgramLogoId,
      setWorkoutProgramLogoId,
    ],
  );

  return (
    <WorkoutProfileEditorContext.Provider value={value}>
      {children}
    </WorkoutProfileEditorContext.Provider>
  );
}

export function useWorkoutProfileEditor() {
  const ctx = React.useContext(WorkoutProfileEditorContext);
  if (!ctx) {
    throw new Error(
      "useWorkoutProfileEditor must be used within WorkoutProfileEditorProvider",
    );
  }
  return ctx;
}

/** Same as useWorkoutProfileEditor but returns null outside the provider (e.g. alternate layouts). */
export function useOptionalWorkoutProfileEditor() {
  return React.useContext(WorkoutProfileEditorContext);
}

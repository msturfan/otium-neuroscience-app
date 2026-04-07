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
};

const WorkoutProfileEditorContext =
  React.createContext<WorkoutProfileEditorContextValue | null>(null);

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

  const value = React.useMemo(
    () => ({
      workoutProfileFormOpen,
      setWorkoutProfileFormOpen,
      requestEditProfile,
      editProfileRequestId,
      setWorkoutPageProfileState,
      workoutPageHasProfile,
      onWorkoutPage,
    }),
    [
      workoutProfileFormOpen,
      setWorkoutProfileFormOpen,
      requestEditProfile,
      editProfileRequestId,
      setWorkoutPageProfileState,
      workoutPageHasProfile,
      onWorkoutPage,
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

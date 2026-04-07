import type * as React from "react";
import {
  IconBallAmericanFootball,
  IconBallBaseball,
  IconBallBasketball,
  IconBallFootball,
  IconBallTennis,
  IconBike,
  IconDisc,
  IconKarate,
  IconKayak,
  IconRun,
  IconSkiJumping,
  IconStopwatch,
  IconSwimming,
  IconWeight,
  IconYoga,
  IconBarbell,
} from "@tabler/icons-react";

export type WorkoutProgramLogoId =
  | "dumbbell"
  | "skiJumping"
  | "weightPlate"
  | "weight"
  | "running"
  | "cycling"
  | "stopwatch"
  | "basketball"
  | "americanFootball"
  | "soccerBall"
  | "tennisBall"
  | "baseball"
  | "kayak"
  | "swimming"
  | "boxingGloves"
  | "yogaMeditation";

export type WorkoutProgramLogoDefinition = {
  id: WorkoutProgramLogoId;
  label: string;
  Icon: React.ComponentType<{
    className?: string;
    size?: number | string;
    stroke?: string;
  }>;
};

export const WORKOUT_PROGRAM_LOGOS: WorkoutProgramLogoDefinition[] = [
  { id: "dumbbell", label: "Dumbbell", Icon: IconBarbell },
  { id: "skiJumping", label: "Ski Jumping", Icon: IconSkiJumping },
  { id: "weightPlate", label: "Weight Plate", Icon: IconDisc },
  { id: "weight", label: "Weight", Icon: IconWeight },
  { id: "running", label: "Running", Icon: IconRun },
  { id: "cycling", label: "Cycling", Icon: IconBike },
  { id: "stopwatch", label: "Stopwatch", Icon: IconStopwatch },
  { id: "basketball", label: "Basketball", Icon: IconBallBasketball },
  { id: "americanFootball", label: "American Football", Icon: IconBallAmericanFootball },
  { id: "soccerBall", label: "Soccer Ball", Icon: IconBallFootball },
  { id: "tennisBall", label: "Tennis Ball", Icon: IconBallTennis },
  { id: "baseball", label: "Baseball", Icon: IconBallBaseball },
  { id: "kayak", label: "Kayak", Icon: IconKayak },
  { id: "swimming", label: "Swimming", Icon: IconSwimming },
  // No boxing gloves icon; closest "combat" icon in Tabler is Karate.
  { id: "boxingGloves", label: "Boxing Gloves", Icon: IconKarate },
  { id: "yogaMeditation", label: "Yoga / Meditation", Icon: IconYoga },
];

export function getWorkoutProgramLogoDefinition(
  id: string | null | undefined,
): WorkoutProgramLogoDefinition {
  const found = WORKOUT_PROGRAM_LOGOS.find((x) => x.id === id);
  return found ?? WORKOUT_PROGRAM_LOGOS[0];
}


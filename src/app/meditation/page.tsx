"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Audio file mapping - Update these paths after adding music files to public/meditation/
const MUSIC_FILES: Record<string, string> = {
  nature: "/meditation/nature-sounds.mp3",
  ocean: "/meditation/ocean-waves.mp3",
  rain: "/meditation/gentle-rain.mp3",
  forest: "/meditation/forest-ambience.mp3",
  silence: "", // No audio for silence
};

// Breathing modes with scientific timing
interface BreathingMode {
  inhale: number; // seconds
  exhale: number; // seconds
  label: string;
  description: string;
}

const BREATHING_MODES: Record<string, BreathingMode> = {
  calm: {
    inhale: 4,
    exhale: 6,
    label: "Calm & Relaxation",
    description: "Inhale 4s • Exhale 6s",
  },
  focus: {
    inhale: 4.5,
    exhale: 4.5,
    label: "Focus & Energy",
    description: "Inhale 4.5s • Exhale 4.5s",
  },
  sleep: {
    inhale: 4,
    exhale: 8,
    label: "Sleep & Deep Relaxation",
    description: "Inhale 4s • Exhale 8s",
  },
};

export default function MeditationPage() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [music, setMusic] = useState("nature");
  const [mode, setMode] = useState<keyof typeof BREATHING_MODES>("calm");
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "exhale">(
    "inhale",
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5; // Set default volume to 50%

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle music change
  useEffect(() => {
    if (audioRef.current && isAnimating && music !== "silence") {
      const audioPath = MUSIC_FILES[music];
      if (audioPath) {
        audioRef.current.src = audioPath;
        audioRef.current.play().catch((error) => {
          console.error("Error playing audio:", error);
        });
      }
    } else if (audioRef.current && music === "silence") {
      audioRef.current.pause();
    }
  }, [music, isAnimating]);

  // Track breathing phase for instructions
  useEffect(() => {
    if (!isAnimating) {
      setBreathingPhase("inhale");
      return;
    }

    const breathingMode = BREATHING_MODES[mode];
    setBreathingPhase("inhale");

    const cycle = () => {
      setBreathingPhase("inhale");
      setTimeout(() => {
        setBreathingPhase("exhale");
      }, breathingMode.inhale * 1000);
    };

    // Start first cycle
    cycle();

    // Repeat cycle
    const totalDuration = breathingMode.inhale + breathingMode.exhale;
    const interval = setInterval(cycle, totalDuration * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isAnimating, mode]);

  const handleStart = () => {
    setIsAnimating(true);
    if (audioRef.current && music !== "silence") {
      const audioPath = MUSIC_FILES[music];
      if (audioPath) {
        audioRef.current.src = audioPath;
        audioRef.current.play().catch((error) => {
          console.error("Error playing audio:", error);
        });
      }
    }
  };

  const handleStop = () => {
    setIsAnimating(false);
    setBreathingPhase("inhale");
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Get breathing animation configuration based on selected mode
  function getBreathingAnimation() {
    const breathingMode = BREATHING_MODES[mode];
    const totalDuration = breathingMode.inhale + breathingMode.exhale;
    const inhalePercent = breathingMode.inhale / totalDuration;

    return {
      scale: [1, 1.2, 1],
      transition: {
        duration: totalDuration,
        repeat: Infinity,
        ease: "easeInOut" as const,
        times: [0, inhalePercent, 1],
      },
    };
  }

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem-5rem)] flex-1 items-center justify-center">
      {/* Initial View - Header and Controls */}
      <div className="w-full max-w-md px-4">
        <div className="space-y-8">
          {/* Header */}
          <AnimatePresence>
            {!isAnimating && (
              <motion.div
                initial={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="space-y-2 text-center"
              >
                <h1 className="text-foreground text-4xl font-bold">
                  Meditation
                </h1>
                <p className="text-muted-foreground">Find your inner peace</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <AnimatePresence>
            {!isAnimating && (
              <motion.div
                initial={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="bg-card/80 border-border flex gap-4 rounded-2xl border p-6 shadow-lg backdrop-blur-sm"
              >
                <div className="flex-1 space-y-2">
                  <label className="text-foreground text-sm font-medium">
                    Music
                  </label>
                  <Select value={music} onValueChange={setMusic}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select music" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nature">Nature Sounds</SelectItem>
                      <SelectItem value="ocean">Ocean Waves</SelectItem>
                      <SelectItem value="rain">Gentle Rain</SelectItem>
                      <SelectItem value="forest">Forest Ambience</SelectItem>
                      <SelectItem value="silence">Silence</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 space-y-2">
                  <label className="text-foreground text-sm font-medium">
                    Mode
                  </label>
                  <Select
                    value={mode}
                    onValueChange={(value) =>
                      setMode(value as keyof typeof BREATHING_MODES)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select breathing mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="calm">
                        {BREATHING_MODES.calm.label}
                      </SelectItem>
                      <SelectItem value="focus">
                        {BREATHING_MODES.focus.label}
                      </SelectItem>
                      <SelectItem value="sleep">
                        {BREATHING_MODES.sleep.label}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Circle and Button - In normal flow when not animating */}
          {!isAnimating && (
            <>
              {/* Animated Circle */}
              <div className="flex items-center justify-center py-8">
                <motion.div
                  className="bg-primary/20 border-primary/10 h-64 w-64 rounded-full border shadow-lg"
                  animate={{
                    scale: 1,
                    rotate: 0,
                    opacity: 0.6,
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Start Button */}
              <div className="flex justify-center">
                <Button onClick={handleStart} size="lg" className="px-12 py-6">
                  Start Meditation
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Meditation View - Absolute positioned when active */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            {/* Animated Circle */}
            <div className="flex items-center justify-center py-8">
              <motion.div
                className="bg-primary/20 border-primary/10 h-64 w-64 rounded-full border shadow-lg"
                animate={
                  isAnimating
                    ? {
                        scale: [1, 1.2, 1],
                      }
                    : {
                        scale: 1,
                      }
                }
                transition={
                  isAnimating
                    ? (() => {
                        const config = getBreathingAnimation();
                        return config.transition;
                      })()
                    : { duration: 0.5 }
                }
              />
            </div>

            {/* Stop Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut", delay: 0.1 }}
              className="flex justify-center"
            >
              <Button
                onClick={handleStop}
                size="lg"
                variant="outline"
                className="px-12 py-6"
              >
                Stop
              </Button>
            </motion.div>

            {/* Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut", delay: 0.2 }}
              className="mt-6 space-y-2 text-center"
            >
              <motion.p
                key={breathingPhase}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-foreground text-lg font-semibold"
              >
                {breathingPhase === "inhale" ? "Inhale" : "Exhale"}
              </motion.p>
              <p className="text-muted-foreground text-sm">
                {BREATHING_MODES[mode].description}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

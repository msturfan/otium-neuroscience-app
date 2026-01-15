"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const [isRotating, setIsRotating] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Handle hydration to prevent mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setIsRotating(true);
    setTheme(theme === "dark" ? "light" : "dark");
    
    // Reset rotation animation after it completes
    setTimeout(() => {
      setIsRotating(false);
    }, 600);
  };

  // Prevent hydration mismatch - show placeholder during SSR
  if (!mounted) {
    return (
      <Button 
        variant="outline" 
        size="icon" 
        className="theme-toggle-button rounded-full"
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="h-[1.2rem] w-[1.2rem] opacity-0" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "theme-toggle-button relative overflow-hidden rounded-full",
        "hover:bg-accent/50 active:scale-95",
        "transition-all duration-200 ease-out"
      )}
      aria-label="Toggle theme"
    >
      <div className="relative h-[1.2rem] w-[1.2rem] flex items-center justify-center">
        <Sun
          className={cn(
            "theme-toggle-icon absolute h-[1.2rem] w-[1.2rem]",
            "transition-all duration-500 ease-in-out",
            isDark
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100",
            isRotating && !isDark && "rotating"
          )}
        />
        <Moon
          className={cn(
            "theme-toggle-icon absolute h-[1.2rem] w-[1.2rem]",
            "transition-all duration-500 ease-in-out",
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0",
            isRotating && isDark && "rotating"
          )}
        />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export default DarkModeToggle;

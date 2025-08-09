"use client";

import { useState, useEffect } from "react";
import { getDynamicGreeting } from "@/lib/greetings-server";

interface DynamicGreetingProps {
  className?: string;
}

export function DynamicGreeting({ className }: DynamicGreetingProps) {
  const [greeting, setGreeting] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const dynamicGreeting = getDynamicGreeting();
    setGreeting(dynamicGreeting);
    setIsLoaded(true);
  }, []);

  if (!isLoaded || !greeting) {
    return (
      <h1 className={`text-center text-3xl font-bold text-gray-800 dark:text-gray-200 ${className || ''}`}>
        <span className="opacity-0">Loading...</span>
      </h1>
    );
  }

  return (
    <h1 
      className={`text-center text-3xl font-bold text-gray-800 dark:text-gray-200 transition-opacity duration-200 ${className || ''}`}
    >
      {greeting}
    </h1>
  );
}
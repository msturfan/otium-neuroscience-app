"use client";

import { useState, useEffect } from "react";
import { Landmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import quotesData from "@/data/quotes.json";

interface Quote {
  text: string;
  author: string;
}

interface QuoteDisplayProps {
  userEmail?: string;
}

export default function QuoteDisplay({ userEmail }: QuoteDisplayProps) {
  const [todayQuote, setTodayQuote] = useState<Quote | null>(null);
  const [timeUntilNextQuote, setTimeUntilNextQuote] = useState<string>("");

  useEffect(() => {
    const getQuoteForToday = () => {
      // Get the current date and calculate day of year
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now.getTime() - start.getTime();
      const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

      // Get quote based on day of year (循环使用 if we have less than 365 quotes)
      const quoteIndex = dayOfYear % quotesData.length;
      setTodayQuote(quotesData[quoteIndex]);
    };

    const calculateTimeUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setDate(midnight.getDate() + 1);
      midnight.setHours(0, 0, 0, 0);

      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeUntilNextQuote(`${hours}h ${minutes}m ${seconds}s`);
    };

    // Initial load
    getQuoteForToday();
    calculateTimeUntilMidnight();

    // Update countdown every second
    const countdownInterval = setInterval(calculateTimeUntilMidnight, 1000);

    // Check for new day at midnight
    const checkForNewDay = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        getQuoteForToday();
      }
    }, 60000); // Check every minute

    return () => {
      clearInterval(countdownInterval);
      clearInterval(checkForNewDay);
    };
  }, []);

  if (!todayQuote) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-muted-foreground">Loading today's quote...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem-5rem)] flex-1 items-center justify-center">
      <div className="w-full max-w-2xl px-4">
        <Card className="relative overflow-hidden">
          {/* Icon at the top */}
          <div className="flex justify-center pt-6 pb-4 sm:pt-8">
            <div className="bg-primary/10 rounded-full p-3 sm:p-4">
              <Landmark className="text-primary h-8 w-8 sm:h-10 sm:w-10" />
            </div>
          </div>

          <CardContent className="px-4 pb-6 sm:px-8 sm:pb-8">
            {/* Quote */}
            <div className="space-y-4 sm:space-y-6">
              <blockquote className="text-center">
                <p className="text-foreground text-xl leading-relaxed font-medium italic sm:text-2xl md:text-3xl">
                  {todayQuote.text}
                </p>
              </blockquote>

              {/* Author */}
              <div className="text-right">
                <p className="text-muted-foreground text-base font-semibold sm:text-lg">
                  — {todayQuote.author}
                </p>
              </div>
            </div>
          </CardContent>

          {/* Decorative gradient background */}
          <div className="absolute inset-0 -z-10 opacity-5">
            <div className="from-primary to-primary absolute inset-0 bg-gradient-to-br via-transparent" />
          </div>
        </Card>

        {/* Additional info card */}
        <div className="mt-4 text-center sm:mt-6">
          <p className="text-muted-foreground text-xs sm:text-sm">
            Visit this page daily for a new inspiring quote to brighten your day
          </p>
        </div>
      </div>
    </div>
  );
}

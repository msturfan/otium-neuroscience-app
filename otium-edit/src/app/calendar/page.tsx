"use client";
import { useState, type ChangeEvent } from "react";
import type { JSX } from "react";

type Stats = {
  weeksLived: number;
  totalWeeks: number;
  weeksRemaining: number;
  percentageLived: number;
  daysLived: number;
  yearsLived: number;
  hoursSlept: number;
  heartbeats: number;
  breaths: number;
  seasons: number;
  birthYear: number;
  birthDate: string;
};

export default function WeeksOfLife(): JSX.Element {
  const [step, setStep] = useState<number>(1);
  const [birthdate, setBirthdate] = useState<string>("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [showHoverData, setShowHoverData] = useState<boolean>(false);
  const [hoverWeek, setHoverWeek] = useState<number | null>(null);

  const calculateStats = (dateString: string): Stats => {
    // Parse date string to ensure consistent handling
    const [year, month, day] = dateString.split("-").map(Number);
    const birthDate = new Date(year, month - 1, day); // month is 0-indexed in JS
    const today = new Date();

    // Validate birth date
    if (birthDate > today) {
      throw new Error("Birth date cannot be in the future");
    }

    if (year < 1900) {
      throw new Error("Birth date seems too far in the past");
    }

    const birthYear = birthDate.getFullYear();

    // Calculate time differences more accurately
    const msInDay = 1000 * 60 * 60 * 24;
    // const msInWeek = msInDay * 7; // kept for clarity, not used

    // Calculate days lived (accounting for timezone)
    const daysLived = Math.floor(
      (today.getTime() - birthDate.getTime()) / msInDay,
    );

    // Calculate weeks lived
    const weeksLived = Math.floor(daysLived / 7);

    // Assuming average lifespan of ~80 years (4160 weeks)
    const totalWeeks = 80 * 52; // 4160 weeks
    const weeksRemaining = Math.max(0, totalWeeks - weeksLived);
    const percentageLived = Math.min(
      100,
      Math.round((weeksLived / totalWeeks) * 100),
    );

    // Calculate years lived
    const yearsLived = Math.floor(daysLived / 365.25);

    // Calculate hours slept (assuming 8 hours per day)
    const hoursSlept = Math.floor(daysLived * 8);

    // Calculate heartbeats (average 70 bpm)
    const heartbeats = Math.floor(daysLived * 24 * 60 * 70);

    // Calculate breaths (average 16 breaths per minute)
    const breaths = Math.floor(daysLived * 24 * 60 * 16);

    // Calculate seasons experienced (roughly 91.25 days per season)
    const seasons = Math.floor(daysLived / 91.25);

    return {
      weeksLived: Math.max(0, weeksLived),
      totalWeeks,
      weeksRemaining,
      percentageLived,
      daysLived: Math.max(0, daysLived),
      yearsLived: Math.max(0, yearsLived),
      hoursSlept: Math.max(0, hoursSlept),
      heartbeats: Math.max(0, heartbeats),
      breaths: Math.max(0, breaths),
      seasons: Math.max(0, seasons),
      birthYear,
      birthDate: dateString,
    };
  };

  // Helper functions for contextual statistics
  const getPopulationAtYear = (year: number): number => {
    // World population estimates by year (in billions)
    const populationData: Record<number, number> = {
      1950: 2.5,
      1960: 3.0,
      1970: 3.7,
      1980: 4.4,
      1990: 5.3,
      2000: 6.1,
      2010: 6.9,
      2020: 7.8,
      2025: 8.1,
    };

    // Find the closest year in our data
    const years = Object.keys(populationData).map(Number);
    const closestYear = years.reduce((prev, curr) =>
      Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev,
    );

    return Math.round(populationData[closestYear] * 1000000000);
  };

  const getAverageBirthsPerDay = (): number => {
    // Approximately 385,000 births per day globally (as of 2023)
    return 385000;
  };

  const getAverageDeathsPerDay = (): number => {
    // Approximately 166,000 deaths per day globally (as of 2023)
    return 166000;
  };

  const handleSubmit = (): void => {
    if (!birthdate) {
      alert("Please select a birth date");
      return;
    }

    try {
      const calculatedStats = calculateStats(birthdate);
      setStats(calculatedStats);
      setStep(2);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      alert(message);
    }
  };

  const getFormattedNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  const renderWeekGrid = (): JSX.Element | null => {
    if (!stats) return null;

    const rows: JSX.Element[] = [];
    const weeksPerRow: number = 52;
    const totalRows: number = Math.ceil(stats.totalWeeks / weeksPerRow);

    for (let row = 0; row < totalRows; row++) {
      const weekCells: JSX.Element[] = [];
      for (let col = 0; col < weeksPerRow; col++) {
        const weekNumber: number = row * weeksPerRow + col;
        if (weekNumber < stats.totalWeeks) {
          const isPast: boolean = weekNumber < stats.weeksLived;
          const isCurrent: boolean = weekNumber === stats.weeksLived;

          let cellClass: string = "w-2 h-2 m-0.5 rounded-sm transition-all ";
          if (isPast) {
            cellClass += "bg-gray-800 dark:bg-gray-300 ";
          } else if (isCurrent) {
            cellClass += "bg-blue-500 dark:bg-blue-400 animate-pulse ";
          } else {
            cellClass += "bg-gray-200 dark:bg-gray-700 ";
          }

          weekCells.push(
            <div
              key={weekNumber}
              className={cellClass}
              onMouseEnter={() => {
                setHoverWeek(weekNumber);
                setShowHoverData(true);
              }}
              onMouseLeave={() => setShowHoverData(false)}
            />,
          );
        }
      }

      rows.push(
        <div key={row} className="flex">
          {weekCells}
        </div>,
      );
    }

    return (
      <div className="mt-8 rounded-md bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-normal text-gray-800 dark:text-gray-200">
          Your life in weeks
        </h2>
        <div className="flex flex-col">{rows}</div>

        {showHoverData && hoverWeek !== null && (
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Week {hoverWeek + 1}:
            {hoverWeek < stats.weeksLived
              ? " A week from your past"
              : hoverWeek === stats.weeksLived
                ? " Your current week"
                : " A week in your potential future"}
          </div>
        )}

        <div className="mt-6 flex text-sm">
          <div className="mr-4 flex items-center">
            <div className="mr-2 h-3 w-3 bg-gray-800 dark:bg-gray-300"></div>
            <span className="text-gray-600 dark:text-gray-400">Past</span>
          </div>
          <div className="mr-4 flex items-center">
            <div className="mr-2 h-3 w-3 bg-blue-500 dark:bg-blue-400"></div>
            <span className="text-gray-600 dark:text-gray-400">Present</span>
          </div>
          <div className="flex items-center">
            <div className="mr-2 h-3 w-3 bg-gray-200 dark:bg-gray-700"></div>
            <span className="text-gray-600 dark:text-gray-400">Future</span>
          </div>
        </div>
      </div>
    );
  };

  const renderStats = (): JSX.Element | null => {
    if (!stats) return null;

    return (
      <div className="mt-8 space-y-6">
        <div className="rounded-md bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-normal text-gray-800 dark:text-gray-200">
            Life highlights
          </h2>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              You've lived{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {getFormattedNumber(stats.weeksLived)}
              </span>{" "}
              weeks, which is{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {stats.percentageLived}%
              </span>{" "}
              of a full life.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              That's{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {getFormattedNumber(stats.daysLived)}
              </span>{" "}
              days of experience and approximately{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {getFormattedNumber(stats.seasons)}
              </span>{" "}
              seasons observed.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Your heart has beaten approximately{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {getFormattedNumber(stats.heartbeats)}
              </span>{" "}
              times.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              You've taken around{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {getFormattedNumber(stats.breaths)}
              </span>{" "}
              breaths and slept about{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {getFormattedNumber(stats.hoursSlept)}
              </span>{" "}
              hours.
            </p>
          </div>
        </div>

        <div className="rounded-md bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-normal text-gray-800 dark:text-gray-200">
            Societal context
          </h2>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              During your lifetime, humanity's population has grown from{" "}
              {stats.birthYear ? (
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {getFormattedNumber(getPopulationAtYear(stats.birthYear))}
                </span>
              ) : (
                ""
              )}{" "}
              to over <span className="font-medium text-gray-900 dark:text-gray-100">8</span>{" "}
              billion people.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              The average person will meet around{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">80,000</span> people
              in their lifetime. You've likely already met approximately{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {getFormattedNumber(
                  Math.round(80000 * (stats.percentageLived / 100)),
                )}
              </span>{" "}
              individuals.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Since your birth, humanity has collectively experienced
              approximately{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {getFormattedNumber(
                  Math.round(stats.daysLived * getAverageBirthsPerDay()),
                )}
              </span>{" "}
              births and{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {getFormattedNumber(
                  Math.round(stats.daysLived * getAverageDeathsPerDay()),
                )}
              </span>{" "}
              deaths.
            </p>
          </div>
        </div>

        <div className="rounded-md bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-normal text-gray-800 dark:text-gray-200">
            Cosmic perspective
          </h2>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Since your birth, Earth has traveled approximately{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {getFormattedNumber(
                  Math.round(stats.daysLived * 1.6 * 1000000),
                )}
              </span>{" "}
              kilometers through space around the Sun.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              The observable universe is about{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">93</span> billion
              light-years across, meaning light takes{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">93</span> billion
              years to cross it. Your entire lifespan is just{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {((80 / 13800000000) * 100).toFixed(10)}%
              </span>{" "}
              of the universe's age.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              During your lifetime, our solar system has moved about{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {getFormattedNumber(Math.round(stats.daysLived * 24 * 828000))}
              </span>{" "}
              kilometers through the Milky Way galaxy.
            </p>
          </div>
        </div>

        <div className="rounded-md bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-normal text-gray-800 dark:text-gray-200">
            Natural world
          </h2>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              You've experienced approximately{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {getFormattedNumber(Math.round(stats.daysLived / 29.53))}
              </span>{" "}
              lunar cycles and{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {stats.yearsLived}
              </span>{" "}
              trips around the Sun.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              A giant sequoia tree can live over 3,000 years. Your current age
              is{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {((stats.yearsLived / 3000) * 100).toFixed(2)}%
              </span>{" "}
              of its potential lifespan.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              During your lifetime, your body has replaced most of its cells
              several times. You are not made of the same atoms you were born
              with.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const handleReset = (): void => {
    setBirthdate("");
    setStats(null);
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pt-16">
      <div className="mx-auto max-w-md">
        <h1 className="mb-2 text-2xl font-normal text-gray-800 dark:text-gray-200">
          Life in weeks
        </h1>
        <p className="mb-8 text-gray-600 dark:text-gray-400">
          A simple visualization to reflect on the passage of time
        </p>

        {step === 1 ? (
          <div className="rounded-md bg-white dark:bg-gray-800 p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-normal text-gray-800 dark:text-gray-200">
              Enter a birthdate
            </h2>
            <div>
              <input
                type="date"
                className="mb-4 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2 text-gray-800 dark:text-gray-200"
                value={birthdate}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setBirthdate(e.target.value)
                }
                max={new Date().toISOString().split("T")[0]} // Prevent future dates
                min="1900-01-01" // Reasonable minimum date
                required
              />
              <button
                onClick={handleSubmit}
                className="w-full rounded-md bg-gray-800 dark:bg-gray-200 py-2 text-white dark:text-gray-800 transition-colors hover:bg-gray-700 dark:hover:bg-gray-300"
                disabled={!birthdate}
              >
                Visualize your time
              </button>
            </div>
          </div>
        ) : (
          <>
            {renderWeekGrid()}
            {renderStats()}
            <button
              onClick={handleReset}
              className="mt-8 w-full rounded-md bg-gray-200 dark:bg-gray-700 py-2 text-gray-800 dark:text-gray-200 transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Start over
            </button>
          </>
        )}
      </div>
    </div>
  );
}

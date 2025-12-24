"use client";

import type { JSX } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Users,
  Globe,
  Sprout,
  Calendar as CalendarIcon,
  Activity,
} from "lucide-react";

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

type CalendarDisplayProps = {
  birthdate: Date;
};

export default function CalendarDisplay({
  birthdate,
}: CalendarDisplayProps): JSX.Element {
  // Convert Date to YYYY-MM-DD string
  const dateString = birthdate.toISOString().split("T")[0];

  const calculateStats = (dateString: string): Stats => {
    // Parse date string to ensure consistent handling
    const [year, month, day] = dateString.split("-").map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();

    const birthYear = birthDate.getFullYear();
    const msInDay = 1000 * 60 * 60 * 24;

    // Calculate days lived
    const daysLived = Math.floor(
      (today.getTime() - birthDate.getTime()) / msInDay,
    );

    // Calculate weeks lived
    const weeksLived = Math.floor(daysLived / 7);

    // Assuming average lifespan of ~80 years (4160 weeks)
    const totalWeeks = 80 * 52;
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

    const years = Object.keys(populationData).map(Number);
    const closestYear = years.reduce((prev, curr) =>
      Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev,
    );

    return Math.round(populationData[closestYear] * 1000000000);
  };

  const getAverageBirthsPerDay = (): number => {
    return 385000;
  };

  const getAverageDeathsPerDay = (): number => {
    return 166000;
  };

  const getFormattedNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  const stats = calculateStats(dateString);

  const renderWeekGrid = (): JSX.Element => {
    const weekCells: JSX.Element[] = [];

    for (let weekNumber = 0; weekNumber < stats.totalWeeks; weekNumber++) {
      const isPast: boolean = weekNumber < stats.weeksLived;
      const isCurrent: boolean = weekNumber === stats.weeksLived;

      let cellClass: string = "w-1.5 h-1.5 rounded-sm transition-all ";
      if (isPast) {
        cellClass += "bg-gray-800 dark:bg-gray-300 ";
      } else if (isCurrent) {
        cellClass += "bg-blue-500 dark:bg-blue-400 animate-pulse ";
      } else {
        cellClass += "bg-gray-200 dark:bg-gray-700 ";
      }

      weekCells.push(<div key={weekNumber} className={cellClass} />);
    }

    return (
      <Card className="mb-0">
        <CardHeader>
          <CardTitle>The Weeks of Your Life</CardTitle>
          <CardDescription>
            Every square is a week you can never reclaim. Spend what remains
            with care.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-0.5">{weekCells}</div>

          <div className="mt-6 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-gray-800 dark:bg-gray-300"></div>
              <span className="text-muted-foreground">Past</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-blue-500 dark:bg-blue-400"></div>
              <span className="text-muted-foreground">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-gray-200 dark:bg-gray-700"></div>
              <span className="text-muted-foreground">Future</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Calculate stats for cards
  const peopleMet = Math.round(80000 * (stats.percentageLived / 100));
  const totalBirths = Math.round(stats.daysLived * getAverageBirthsPerDay());
  const totalDeaths = Math.round(stats.daysLived * getAverageDeathsPerDay());
  const earthDistance = Math.round(stats.daysLived * 1.6 * 1000000);
  const galaxyDistance = Math.round(stats.daysLived * 24 * 828000);
  const lunarCycles = Math.round(stats.daysLived / 29.53);
  const sequoiaPercent = ((stats.yearsLived / 3000) * 100).toFixed(2);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="mb-0">
            <h1 className="mb-0 text-3xl font-semibold">Your Timeline</h1>
            <p className="text-muted-foreground">
              Past weeks are set in ink, this one shines in the moment, the rest
              are blank pages.
            </p>
          </div>

          {/* 4 Insight Cards */}
          <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-4">
            {/* Life Highlights Card */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Life Highlights</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {getFormattedNumber(stats.weeksLived)} weeks
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <Activity className="mr-1 size-3" />
                    {stats.percentageLived}%
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="text-muted-foreground size-4" />
                    <span className="text-muted-foreground">
                      {getFormattedNumber(stats.daysLived)} days lived
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="text-muted-foreground size-4" />
                    <span className="text-muted-foreground">
                      {getFormattedNumber(stats.heartbeats)} heartbeats
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="text-muted-foreground size-4" />
                    <span className="text-muted-foreground">
                      {getFormattedNumber(stats.breaths)} breaths taken
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  {stats.yearsLived} years of experience{" "}
                  <CalendarIcon className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  {getFormattedNumber(stats.seasons)} seasons observed
                </div>
              </CardFooter>
            </Card>

            {/* Societal Context Card */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Societal Context</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {getFormattedNumber(getPopulationAtYear(stats.birthYear))}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <Users className="mr-1 size-3" />
                    8B+
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="text-muted-foreground size-4" />
                    <span className="text-muted-foreground">
                      ~{getFormattedNumber(peopleMet)} people met
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="text-muted-foreground size-4" />
                    <span className="text-muted-foreground">
                      {getFormattedNumber(totalBirths)} global births
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="text-muted-foreground size-4" />
                    <span className="text-muted-foreground">
                      {getFormattedNumber(totalDeaths)} global deaths
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Population growth since birth <Users className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  From {stats.birthYear} to today
                </div>
              </CardFooter>
            </Card>

            {/* Cosmic Perspective Card */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Cosmic Perspective</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {getFormattedNumber(earthDistance)} km
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <Globe className="mr-1 size-3" />
                    Space
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Globe className="text-muted-foreground size-4" />
                    <span className="text-muted-foreground">
                      Earth traveled around Sun
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="text-muted-foreground size-4" />
                    <span className="text-muted-foreground">
                      {getFormattedNumber(galaxyDistance)} km through galaxy
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="text-muted-foreground size-4" />
                    <span className="text-muted-foreground">
                      {((80 / 13800000000) * 100).toFixed(10)}% of universe age
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Cosmic journey continues <Globe className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Moving through the Milky Way
                </div>
              </CardFooter>
            </Card>

            {/* Natural World Card */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Natural World</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {stats.yearsLived} years
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <Sprout className="mr-1 size-3" />
                    {sequoiaPercent}%
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="text-muted-foreground size-4" />
                    <span className="text-muted-foreground">
                      {getFormattedNumber(lunarCycles)} lunar cycles
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="text-muted-foreground size-4" />
                    <span className="text-muted-foreground">
                      {stats.yearsLived} trips around the Sun
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sprout className="text-muted-foreground size-4" />
                    <span className="text-muted-foreground">
                      {sequoiaPercent}% of sequoia lifespan
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Connected to nature <Sprout className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Cells replaced, atoms renewed
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      {renderWeekGrid()}
    </div>
  );
}

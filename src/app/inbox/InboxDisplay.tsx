"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Plus,
  CalendarDays,
  BarChart3,
  Brain,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

const mockNotes = [
  {
    id: "1",
    date: "Sun, Sep 14",
    title: "Lazy Sunday + meal prep",
    preview: "Took a long walk. Prepped chicken and veggies for the week…",
  },
  {
    id: "2",
    date: "Tue, Sep 16",
    title: "Work sprint & gym",
    preview: "Lots of meetings. Squeezed in a 30‑min lift after 7pm…",
  },
  {
    id: "3",
    date: "Thu, Sep 18",
    title: "Friend catch‑up",
    preview: "Called Maya, felt lighter after talking through the move…",
  },
];

interface InboxDisplayProps {
  userEmail?: string;
}

export default function HomePage({ userEmail }: InboxDisplayProps) {
  const hasNotes = mockNotes.length > 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back 👋</h1>
          <p className="text-muted-foreground mt-1">
            Capture your days. Get a realistic weekly read on your life.
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full px-3 py-1">
          Weekly Insights — in development
        </Badge>
      </div>

      {/* Under‑construction notice */}
      <Alert>
        <AlertCircle className="h-5 w-5" />
        <AlertTitle>Weekly report is coming soon</AlertTitle>
        <AlertDescription>
          You can write notes now. Each week, Otium AI will generate a private
          summary that spots patterns (energy, mood, habits) and offers grounded
          suggestions — without clichés.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left: This Week's Notes */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>This week’s notes</CardTitle>
            <CardDescription>
              Keep jotting things down. Short is fine — consistency matters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hasNotes ? (
              <EmptyState />
            ) : (
              <ul className="space-y-3">
                {mockNotes.map((n) => (
                  <li
                    key={n.id}
                    className="group hover:bg-muted/40 flex items-start justify-between rounded-xl border p-4 transition-colors"
                  >
                    <div>
                      <div className="text-muted-foreground text-sm">
                        {n.date}
                      </div>
                      <div className="font-medium">{n.title}</div>
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                        {n.preview}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex items-center justify-between">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add a note
              </Button>
              <Button variant="secondary" disabled>
                View weekly report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right: How it will work */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>How your weekly insight works</CardTitle>
            <CardDescription>
              A no‑fluff, realistic summary of your week.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Step
              icon={<CalendarDays className="h-4 w-4" />}
              title="Write when you can"
              text="Daily is great, but even 2–3 short notes help the model learn your rhythms."
            />
            <Separator />
            <Step
              icon={<Brain className="h-4 w-4" />}
              title="Pattern detection"
              text="We look at mood, energy, people, and contexts that nudge your week up or down."
            />
            <Separator />
            <Step
              icon={<BarChart3 className="h-4 w-4" />}
              title="Weekly report"
              text="You’ll get a private summary with trends, tough‑love takeaways, and specific, doable next steps."
            />
          </CardContent>
        </Card>
      </div>

      {/* Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            What we’re building next for your weekly view.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-muted-foreground list-inside list-disc space-y-2 text-sm">
            <li>One‑tap weekly PDF export</li>
            <li>Tag‑based insights (work, health, relationships)</li>
            <li>Streaks and gentle nudges when you miss days</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Step({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-md border p-2">{icon}</div>
      <div>
        <div className="leading-none font-medium">{title}</div>
        <p className="text-muted-foreground mt-1 text-sm">{text}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
      <div className="mb-2 text-lg font-medium">No notes yet this week</div>
      <p className="text-muted-foreground mb-4 max-w-sm text-sm">
        Add a few thoughts today. Short, honest notes power your weekly insight.
      </p>
      <Button>
        <Plus className="mr-2 h-4 w-4" /> Write a quick note
      </Button>
    </div>
  );
}

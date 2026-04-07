"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
  CheckCircle2,
  FileText,
} from "lucide-react";
import LLMResponse from "@/components/LLMResponse";

interface Note {
  id: string;
  title: string;
  text: string;
  createdAt: Date;
  preview: string;
  date: string;
}

interface WeeklyReport {
  reportText: string;
  generatedAt: Date;
  weekStart: Date;
}

interface InboxData {
  notes: Note[];
  report: WeeklyReport | null;
  noteCount: number;
  hasEnoughNotes: boolean;
  errorMessage: string | null;
}

interface InboxDisplayProps {
  userEmail?: string;
  initialData: InboxData;
}

export default function InboxDisplay({ userEmail, initialData }: InboxDisplayProps) {
  const router = useRouter();
  const [showReport, setShowReport] = useState(false);
  const { notes, report, noteCount, hasEnoughNotes, errorMessage } = initialData;
  const hasNotes = notes.length > 0;

  const handleAddNote = () => {
    router.push("/");
  };

  const handleViewNote = (noteId: string) => {
    router.push(`/?noteId=${noteId}`);
  };

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
        {hasEnoughNotes && report && (
          <Badge variant="default" className="rounded-full px-3 py-1">
            Report Ready
          </Badge>
        )}
      </div>

      {/* Conditional Alert based on note count and report status */}
      {hasEnoughNotes && report ? (
        <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-900 dark:text-green-100">
            Your weekly report is ready!
          </AlertTitle>
          <AlertDescription className="text-green-800 dark:text-green-200">
            We've analyzed your {noteCount} notes from this week and generated a
            personalized report. Click below to view your insights.
          </AlertDescription>
        </Alert>
      ) : !hasEnoughNotes ? (
        <Alert>
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Write more notes for better insights</AlertTitle>
          <AlertDescription>
            You have {noteCount} {noteCount === 1 ? "note" : "notes"} this week.
            Write at least 2 notes per week to get a detailed weekly report. Try
            writing every day for the best results!
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Weekly report is coming soon</AlertTitle>
          <AlertDescription>
            Your report will be generated every Sunday at 9 AM. Keep writing
            notes to get personalized insights about your week.
          </AlertDescription>
        </Alert>
      )}

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
              <EmptyState onAddNote={handleAddNote} />
            ) : (
              <>
                <ul className="space-y-3">
                  {notes.map((n) => (
                    <li
                      key={n.id}
                      className="group hover:bg-muted/40 flex items-start justify-between rounded-xl border p-4 transition-colors cursor-pointer"
                      onClick={() => handleViewNote(n.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-muted-foreground text-sm">
                          {n.date}
                        </div>
                        <div className="font-medium truncate">{n.title}</div>
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                          {n.preview}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewNote(n.id);
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-center justify-between">
                  <Button onClick={handleAddNote}>
                    <Plus className="mr-2 h-4 w-4" /> Add a note
                  </Button>
                  {hasEnoughNotes && report ? (
                    <Button
                      variant="secondary"
                      onClick={() => setShowReport(!showReport)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      {showReport ? "Hide" : "View"} weekly report
                    </Button>
                  ) : (
                    <Button variant="secondary" disabled>
                      View weekly report
                    </Button>
                  )}
                </div>
              </>
            )}
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

      {/* Weekly Report Display */}
      {hasEnoughNotes && report && showReport && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Weekly Report</CardTitle>
                <CardDescription>
                  Generated on{" "}
                  {new Date(report.generatedAt).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <LLMResponse content={report.reportText} />
          </CardContent>
        </Card>
      )}

      {/* Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            What we're building next for your weekly view.
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

function EmptyState({ onAddNote }: { onAddNote: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
      <div className="mb-2 text-lg font-medium">No notes yet this week</div>
      <p className="text-muted-foreground mb-4 max-w-sm text-sm">
        Add a few thoughts today. Short, honest notes power your weekly insight.
      </p>
      <Button onClick={onAddNote}>
        <Plus className="mr-2 h-4 w-4" /> Write a quick note
      </Button>
    </div>
  );
}

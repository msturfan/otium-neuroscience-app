import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Mail, Plus, Settings, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      {/* Header Section */}
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Otium AI – FAQ & Help Center
        </h1>
        <div className="text-muted-foreground space-y-1 text-sm">
          <p>
            <strong>Last updated:</strong> December 2025
          </p>
          <p>
            <strong>Created in:</strong> Denver, CO & San Francisco, CA
          </p>
        </div>
      </div>

      {/* About Section */}
      <Card>
        <CardHeader>
          <CardTitle>About Otium AI</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            Otium AI is your personal life insight companion. By simply writing
            your daily entries in our app, you'll receive a weekly AI-powered
            report that offers thoughtful, realistic, and non-cliché feedback
            about your life patterns — helping you improve, reflect, and grow
            without sugar-coating or fluff.
          </p>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">
                  1. What does Otium AI do?
                </span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <p className="text-muted-foreground">
                Otium AI analyzes your daily journal entries and generates a
                weekly report with practical, personalized insights. It
                highlights patterns, offers constructive feedback, and suggests
                ways to improve your life based on your unique experiences.
              </p>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">
                  2. How do I use Otium AI?
                </span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <ol className="text-muted-foreground list-inside list-decimal space-y-2">
                <li>Open the app.</li>
                <li>
                  Write your daily entry (short or long — it's up to you).
                </li>
                <li>
                  At the end of the week, receive your AI-generated life
                  analysis report.
                </li>
                <li>Review, reflect, and take action.</li>
              </ol>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">
                  3. Is my data private?
                </span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <p className="text-muted-foreground">
                Yes. Your journal entries are encrypted and stored securely. We
                will never sell your personal data or share it without your
                consent. You are always in control of your information.
              </p>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">
                  4. How accurate is the AI's feedback?
                </span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <p className="text-muted-foreground">
                Otium AI is trained to recognize life patterns, habits, and
                emotions in your entries. While it's designed to be insightful,
                it's not a substitute for professional therapy or counseling.
              </p>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">
                  5. Do I need to write every day?
                </span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <p className="text-muted-foreground">
                For the most accurate and meaningful weekly reports, we
                recommend daily entries — but even a few times a week will still
                generate valuable insights.
              </p>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">
                  6. Can I edit or delete my past entries?
                </span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <p className="text-muted-foreground">
                Yes. You can edit or delete any journal entry from your timeline
                at any time.
              </p>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">
                  7. What makes Otium AI different from other journal apps?
                </span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <p className="text-muted-foreground">
                Unlike other apps, Otium AI doesn't give generic advice. Our AI
                provides grounded, realistic suggestions based on <em>your</em>{" "}
                actual life — no clichés, no motivational fluff.
              </p>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">
                  8. Is Otium AI free?
                </span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-4">
              <p className="text-muted-foreground">
                We offer a free tier with limited weekly insights and a premium
                subscription for deeper analysis, trend tracking, and priority
                support.
              </p>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Help & Troubleshooting Section */}
      <Card>
        <CardHeader>
          <CardTitle>Help & Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-semibold">
              Getting Started
            </h3>
            <ul className="text-muted-foreground space-y-2">
              <li>
                <strong>Sign Up:</strong> Create your account with an email and
                password.
              </li>
              <li>
                <strong>Daily Entry:</strong> Tap the "+" button to start your
                journal entry.
              </li>
              <li>
                <strong>Save:</strong> Hit "Save" when done — your writing is
                now part of your weekly report.
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 font-semibold">
              I didn't get my weekly report
            </h3>
            <ul className="text-muted-foreground list-inside list-disc space-y-2">
              <li>
                Make sure you've entered at least one journal entry in the past
                7 days.
              </li>
              <li>Check your email and in-app notifications.</li>
              <li>
                If still missing, contact <strong>support@otiumai.com</strong>.
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 font-semibold">My app isn't syncing</h3>
            <ul className="text-muted-foreground list-inside list-disc space-y-2">
              <li>Ensure you're connected to Wi-Fi or mobile data.</li>
              <li>Log out and back in.</li>
              <li>If the problem persists, reinstall the app.</li>
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 font-semibold">I want to delete my account</h3>
            <ul className="text-muted-foreground list-inside list-disc space-y-2">
              <li>
                Go to <strong>Settings → Account → Delete Account</strong>.
              </li>
              <li>
                Once confirmed, all your data will be permanently deleted.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Contact Support Section */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Support</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="font-medium">support@otiumai.com</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://x.com/otiumai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 transition-colors hover:underline"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span className="font-medium">x.com/otiumai</span>
              </a>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://www.instagram.com/otiumai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 transition-colors hover:underline"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span className="font-medium">instagram.com/otiumai</span>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pro Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Pro Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-muted-foreground space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-foreground font-medium">•</span>
              Write honestly — the AI works best with real, unfiltered thoughts.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground font-medium">•</span>
              Check your trends every month for deeper self-awareness.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-foreground font-medium">•</span>
              Use tags or keywords in entries (e.g., "work," "health,"
              "relationships") for more tailored reports.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

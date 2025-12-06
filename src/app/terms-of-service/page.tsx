import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      {/* Header Section */}
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Terms of Service
        </h1>
        <div className="text-muted-foreground space-y-1 text-sm">
          <p>
            <strong>Last updated:</strong> August 2025
          </p>
          <p>
            <strong>Applies to:</strong> Otium AI apps and website
          </p>
        </div>
      </div>

      {/* Intro / Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            By creating an account or using Otium AI (the “Service”), you agree
            to these Terms of Service. Please read each section below. If you do
            not agree, do not use the Service.
          </p>
        </CardContent>
      </Card>

      {/* Terms Sections (Collapsible) */}
      <Card>
        <CardHeader>
          <CardTitle>Agreement Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 1 */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">
                  1. Acceptance of Terms
                </span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground px-4 pb-4">
              By creating an account or using our App (“Service”), you agree to
              be bound by these Terms of Service. If you do not agree, you may
              not use the Service.
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* 2 */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">
                  2. Description of Service
                </span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground px-4 pb-4">
              We provide a daily note-taking platform enhanced with AI-generated
              weekly feedback. Features may be updated, modified, or
              discontinued at our discretion.
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* 3 */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">3. Eligibility</span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground px-4 pb-4">
              You must be at least 13 years old (16 in the EU) to use the
              Service. By using the Service, you confirm that you meet the
              minimum legal age in your jurisdiction.
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* 4 */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">
                  4. User Responsibilities
                </span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground space-y-2 px-4 pb-4">
              <p>You are solely responsible for the content you create.</p>
              <p>
                You agree not to use the Service for unlawful, harmful, or
                abusive purposes.
              </p>
              <p>
                You agree not to attempt to reverse engineer or disrupt the
                Service.
              </p>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* 5 */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">
                  5. Account and Security
                </span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground space-y-2 px-4 pb-4">
              <p>You must provide accurate registration information.</p>
              <p>
                You are responsible for safeguarding your account credentials.
              </p>
              <p>Notify us immediately of any unauthorized use.</p>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* 6 */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">
                  6. AI-Generated Feedback Disclaimer
                </span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground px-4 pb-4">
              The weekly feedback provided by AI is for informational purposes
              only and does not constitute professional, medical, or therapeutic
              advice. You assume full responsibility for how you use AI
              feedback.
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* 7 */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">
                  7. Intellectual Property
                </span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground space-y-2 px-4 pb-4">
              <p>
                <strong>User Content:</strong> You retain all rights to your
                notes and entries.
              </p>
              <p>
                <strong>License:</strong> By using the Service, you grant us a
                limited, revocable license to store, process, and use your
                content solely for providing the Service.
              </p>
              <p>
                <strong>Our Content:</strong> The App, AI models, and software
                remain our intellectual property.
              </p>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* 8 */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">8. Termination</span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground px-4 pb-4">
              We may suspend or terminate your account if you violate these
              Terms. You may delete your account at any time. Upon termination,
              your data will be deleted in accordance with our Privacy Policy.
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* 9 */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">
                  9. Limitation of Liability
                </span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground px-4 pb-4">
              To the maximum extent permitted by law, we are not liable for any
              indirect, incidental, or consequential damages arising from use of
              the Service, including reliance on AI-generated outputs.
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* 10 */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">10. Governing Law</span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground px-4 pb-4">
              These Terms are governed by the laws of [Your Country], except
              where consumer protection laws in your region (e.g., EU or
              California) provide additional rights.
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* 11 */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">
                  11. Changes to Terms
                </span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground px-4 pb-4">
              We may update these Terms. Continued use of the Service
              constitutes acceptance of the revised Terms.
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* 12 */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">12. Contact</span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground px-4 pb-4">
              Questions? Contact us at{" "}
              <a className="underline" href="mailto:support@otiumai.com">
                support@otiumai.com
              </a>
              .
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Footer cross-link */}
      <p className="text-muted-foreground text-center text-sm">
        Looking for our Privacy Policy?{" "}
        <Link
          href="/privacy-policy"
          className="hover:text-primary underline underline-offset-4"
        >
          Read it here
        </Link>
        .
      </p>
    </div>
  );
}

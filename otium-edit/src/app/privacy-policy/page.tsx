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

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      {/* Header Section */}
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Privacy Policy (GDPR + CCPA/CPRA)
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

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            This Privacy Policy explains how we collect, use, disclose, and
            safeguard your information when you use Otium AI (the "Service"). It
            includes provisions to address the EU General Data Protection
            Regulation (GDPR) and the California Consumer Privacy Act/Privacy
            Rights Act (CCPA/CPRA).
          </p>
        </CardContent>
      </Card>

      {/* Sections */}
      <Card>
        <CardHeader>
          <CardTitle>Policy Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 1. Data Controller */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">
                  1. Data Controller
                </span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground space-y-2 px-4 pb-4">
              <p>
                For EU users, the Data Controller is{" "}
                <strong>[Your Company Name &amp; Address]</strong>.
              </p>
              <p>
                Contact:{" "}
                <a className="underline" href="mailto:support@otiumai.com">
                  support@otiumai.com
                </a>
              </p>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* 2. Information We Collect */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">
                  2. Information We Collect
                </span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground px-4 pb-4">
              <ul className="list-inside list-disc space-y-2">
                <li>
                  <strong>Account Information:</strong> Name, email, login
                  credentials (encrypted).
                </li>
                <li>
                  <strong>User Content:</strong> Notes, entries, and uploaded
                  data.
                </li>
                <li>
                  <strong>AI Processing Data:</strong> Text inputs processed to
                  generate feedback.
                </li>
                <li>
                  <strong>Device/Usage Data:</strong> IP address, device type,
                  OS, and usage analytics.
                </li>
                <li>
                  <strong>Optional Information:</strong> If you contact support,
                  we may collect additional details you provide.
                </li>
              </ul>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* 3. Lawful Bases of Processing (GDPR) */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">
                  3. Lawful Bases of Processing (GDPR)
                </span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground px-4 pb-4">
              <ul className="list-inside list-disc space-y-2">
                <li>
                  <strong>Contract:</strong> To provide the Service you signed
                  up for.
                </li>
                <li>
                  <strong>Consent:</strong> For optional features such as
                  marketing emails.
                </li>
                <li>
                  <strong>Legitimate Interests:</strong> To improve the Service
                  and prevent fraud.
                </li>
                <li>
                  <strong>Legal Obligation:</strong> To comply with applicable
                  laws.
                </li>
              </ul>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* 4. How We Use Your Data */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">
                  4. How We Use Your Data
                </span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground px-4 pb-4">
              <ul className="list-inside list-disc space-y-2">
                <li>To provide daily notes and weekly AI feedback.</li>
                <li>
                  To improve our AI models (with anonymized/aggregated data).
                </li>
                <li>
                  To communicate important updates, security notices, or support
                  responses.
                </li>
                <li>To ensure compliance and prevent misuse.</li>
              </ul>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* 5. Data Sharing */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">5. Data Sharing</span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground space-y-2 px-4 pb-4">
              <p>We do not sell your personal data.</p>
              <p>We may share limited data with:</p>
              <ul className="list-inside list-disc space-y-2 pl-4">
                <li>
                  <strong>Service Providers</strong> (cloud hosting, analytics,
                  AI infrastructure) under confidentiality agreements.
                </li>
                <li>
                  <strong>Legal Authorities</strong> if required to comply with
                  applicable law.
                </li>
              </ul>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* 6. International Data Transfers */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">
                  6. International Data Transfers
                </span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground space-y-2 px-4 pb-4">
              <p>
                If you are located in the EU/EEA, your data may be transferred
                outside the EU. We use safeguards such as:
              </p>
              <ul className="list-inside list-disc space-y-2 pl-4">
                <li>
                  <strong>Standard Contractual Clauses (SCCs)</strong> approved
                  by the EU Commission.
                </li>
                <li>
                  Data storage in secure, GDPR-compliant hosting environments.
                </li>
              </ul>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* 7. Data Retention */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">7. Data Retention</span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground px-4 pb-4">
              <ul className="list-inside list-disc space-y-2">
                <li>Account data is retained while your account is active.</li>
                <li>Notes and entries remain until you delete them.</li>
                <li>
                  If you close your account, we delete personal data within{" "}
                  <strong>30 days</strong>, unless required by law.
                </li>
              </ul>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* 8. Security */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">8. Security</span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground px-4 pb-4">
              We use encryption (in transit and at rest) and industry-standard
              safeguards. However, no system is 100% secure.
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* 9. Your Rights (GDPR & CCPA/CPRA) */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">
                  9. Your Rights (GDPR &amp; CCPA/CPRA)
                </span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground space-y-2 px-4 pb-4">
              <ul className="list-inside list-disc space-y-2">
                <li>
                  <strong>Access:</strong> Request a copy of your data.
                </li>
                <li>
                  <strong>Correction:</strong> Update or fix inaccurate data.
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion ("Right to be
                  Forgotten").
                </li>
                <li>
                  <strong>Portability:</strong> Request your data in a
                  structured format.
                </li>
                <li>
                  <strong>Restriction/Objection:</strong> Limit or object to
                  certain processing.
                </li>
                <li>
                  <strong>Opt-Out (CCPA/CPRA):</strong> California residents can
                  opt out of "sale" or "sharing" of data.
                </li>
                <li>
                  <strong>Non-Discrimination:</strong> We will not discriminate
                  against you for exercising your privacy rights.
                </li>
              </ul>
              <p>
                To exercise rights, contact us at{" "}
                <a className="underline" href="mailto:support@otiumai.com">
                  support@otiumai.com
                </a>
                .
              </p>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* 10. Children’s Privacy */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">
                  10. Children’s Privacy
                </span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground px-4 pb-4">
              The Service is not intended for users under 13 (or 16 in the EU).
              We do not knowingly collect data from children.
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* 11. Changes to Policy */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between p-4"
              >
                <span className="text-left font-medium">
                  11. Changes to Policy
                </span>
                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="text-muted-foreground px-4 pb-4">
              We may revise this Privacy Policy. Updates will be posted in the
              App, and continued use constitutes acceptance.
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* 12. Contact */}
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
            <CollapsibleContent className="text-muted-foreground space-y-2 px-4 pb-4">
              <p>
                For privacy inquiries, contact:{" "}
                <a className="underline" href="mailto:support@otiumai.com">
                  support@otiumai.com
                </a>
              </p>
              <p>
                If you are an EU resident, you may also contact your local Data
                Protection Authority.
              </p>
              <p>
                California residents may also designate an authorized agent to
                submit privacy requests on their behalf.
              </p>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Footer cross-link */}
      <p className="text-muted-foreground text-center text-sm">
        Looking for our Terms of Service?{" "}
        <Link
          href="/terms-of-service"
          className="hover:text-primary underline underline-offset-4"
        >
          Read them here
        </Link>
        .
      </p>
    </div>
  );
}

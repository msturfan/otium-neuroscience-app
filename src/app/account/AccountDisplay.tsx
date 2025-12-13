"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { updateFirstNameAction, updateLastNameAction } from "@/actions/users";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";

interface AccountDisplayProps {
  initialFirstName: string | null;
  initialLastName: string | null;
  initialEmail: string;
}

export default function AccountDisplay({
  initialFirstName,
  initialLastName,
  initialEmail,
}: AccountDisplayProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initialFirstName || "");
  const [lastName, setLastName] = useState(initialLastName || "");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isSaving, startTransition] = useTransition();

  // Track last saved values to compare against
  const [savedFirstName, setSavedFirstName] = useState(initialFirstName || "");
  const [savedLastName, setSavedLastName] = useState(initialLastName || "");

  // Sync saved values when initial props change (after router.refresh())
  // This ensures the component stays in sync with server data
  useEffect(() => {
    const newSavedFirstName = initialFirstName || "";
    const newSavedLastName = initialLastName || "";

    // Only update if the saved values differ from initial props
    // This happens after router.refresh() when server data is updated
    if (
      savedFirstName !== newSavedFirstName ||
      savedLastName !== newSavedLastName
    ) {
      setSavedFirstName(newSavedFirstName);
      setSavedLastName(newSavedLastName);

      // If current values match old saved values, update them to new saved values
      // This handles the case where user saved and page refreshed
      if (firstName === savedFirstName && firstName !== newSavedFirstName) {
        setFirstName(newSavedFirstName);
      }
      if (lastName === savedLastName && lastName !== newSavedLastName) {
        setLastName(newSavedLastName);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFirstName, initialLastName]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return firstName !== savedFirstName || lastName !== savedLastName;
  }, [firstName, lastName, savedFirstName, savedLastName]);

  const handleCancel = () => {
    setFirstName(savedFirstName);
    setLastName(savedLastName);
  };

  const handleSave = () => {
    startTransition(async () => {
      const updates: Promise<{
        errorMessage: string | null;
      }>[] = [];

      // Collect all updates that need to be made
      if (firstName !== savedFirstName) {
        updates.push(updateFirstNameAction(firstName));
      }
      if (lastName !== savedLastName) {
        updates.push(updateLastNameAction(lastName));
      }

      // Execute all updates
      const results = await Promise.all(updates);

      // Check for errors
      const errors = results.filter((r) => r.errorMessage);
      if (errors.length > 0) {
        errors.forEach((error) => {
          toast.error(error.errorMessage || "An error occurred");
        });
        // Revert on error
        handleCancel();
      } else {
        // Store old values for success messages
        const firstNameChanged = firstName !== savedFirstName;
        const lastNameChanged = lastName !== savedLastName;

        // Update saved values
        setSavedFirstName(firstName);
        setSavedLastName(lastName);

        // Show success messages
        if (firstNameChanged) {
          toast.success("First name updated");
        }
        if (lastNameChanged) {
          toast.success("Last name updated");
        }

        // Refresh router to update sidebar
        router.refresh();
      }
    });
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Manage your account information and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your personal information. Click Save to apply changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
              disabled={isSaving}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
              disabled={isSaving}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={initialEmail}
              placeholder="Your email"
              disabled
              className="bg-muted"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Change your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => setIsPasswordDialogOpen(true)}
          >
            Change Password
          </Button>
        </CardContent>
      </Card>

      <ChangePasswordDialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      />

      {/* Save and Cancel buttons - fixed at bottom-right */}
      {hasUnsavedChanges && (
        <div className="bg-background fixed right-6 bottom-6 flex gap-2 rounded-lg border p-2 shadow-lg">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

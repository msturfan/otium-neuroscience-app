"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { generateNoteSuggestions } from "@/actions/generate-suggestions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteText: string;
};

export function AISuggestionsDialog({
  open,
  onOpenChange,
  noteText,
}: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuggestions([]);

    try {
      const result = await generateNoteSuggestions(noteText);

      if (result.errorMessage) {
        setErrorMessage(result.errorMessage);
      } else {
        setSuggestions(result.suggestions);
      }
    } catch (error) {
      setErrorMessage(
        "An error occurred while generating suggestions. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch suggestions when dialog opens
  useEffect(() => {
    if (open && noteText.trim().length >= 20) {
      handleGetSuggestions();
    }
    // Reset when dialog closes
    if (!open) {
      setSuggestions([]);
      setErrorMessage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, noteText]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Suggestions to improve your daily note
          </DialogTitle>
          <DialogDescription>
            AI-powered suggestions to help you create a more complete daily log
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="text-muted-foreground mb-4 h-8 w-8 animate-spin" />
              <p className="text-muted-foreground text-sm">
                Analyzing your note...
              </p>
            </div>
          ) : errorMessage ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="text-destructive text-sm">{errorMessage}</p>
              {noteText.trim().length < 20 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              )}
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-3">
              <p className="text-muted-foreground mb-4 text-sm">
                Consider adding these details to make your note more complete:
              </p>
              <ul className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 rounded-lg border bg-muted/50 p-3"
                  >
                    <CheckCircle2 className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                    <span className="text-sm leading-relaxed">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-muted-foreground py-8 text-center text-sm">
              No suggestions available. Try writing more content in your note.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          {!isLoading && suggestions.length > 0 && (
            <Button variant="outline" onClick={handleGetSuggestions}>
              Refresh Suggestions
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


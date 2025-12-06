"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function formatDate(date: Date | undefined) {
  if (!date) {
    return "";
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime());
}

// Check if a date is valid in the real calendar (e.g., Feb 29, 2001 is invalid)
function isValidCalendarDate(
  year: number,
  month: number,
  day: number,
): boolean {
  // Month validation (1-12)
  if (month < 1 || month > 12) {
    return false;
  }

  // Day validation (must be at least 1)
  if (day < 1) {
    return false;
  }

  // Check if the date actually exists in the calendar
  const date = new Date(year, month - 1, day);

  // Verify the date components match what we entered
  // This catches invalid dates like Feb 30, Feb 29 in non-leap years, etc.
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    isValidDate(date)
  );
}

type DatePickerProps = {
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  value?: Date | undefined;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  required?: boolean;
  maxDate?: Date;
  minDate?: Date;
  className?: string;
  error?: string;
};

export function DatePicker({
  id,
  name,
  label,
  placeholder = "Select a date",
  value,
  onChange,
  disabled = false,
  required = false,
  maxDate,
  minDate,
  className,
  error,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(value);
  const [month, setMonth] = React.useState<Date | undefined>(date);
  const [inputValue, setInputValue] = React.useState(formatDate(date));
  const [localError, setLocalError] = React.useState<string | undefined>(error);

  React.useEffect(() => {
    setDate(value);
    setInputValue(formatDate(value));
    if (value) {
      setMonth(value);
    }
  }, [value]);

  React.useEffect(() => {
    setLocalError(error);
  }, [error]);

  // Auto-format input to add slashes (05182000 -> 05/18/2000 or 05/182000 -> 05/18/2000)
  const formatInputWithSlashes = (value: string): string => {
    // Remove all non-digit characters to get just the numbers
    const digitsOnly = value.replace(/\D/g, "");

    // If no digits, return empty
    if (digitsOnly.length === 0) {
      return "";
    }

    // Always format based on digit count, adding slashes in the right positions
    if (digitsOnly.length <= 2) {
      // Just month: "05"
      return digitsOnly;
    } else if (digitsOnly.length <= 4) {
      // Month and day: "05" + "/" + "18"
      return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
    } else {
      // Month, day, and year: "05" + "/" + "18" + "/" + "2000"
      return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4, 8)}`;
    }
  };

  // Check if date is within min/max range
  const isDateInRange = (dateToCheck: Date): boolean => {
    if (maxDate && dateToCheck > maxDate) return false;
    if (minDate && dateToCheck < minDate) return false;
    return true;
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setDate(undefined);
      setInputValue("");
      setLocalError(undefined);
      onChange?.(undefined);
      return;
    }

    // Check age restrictions
    if (!isDateInRange(selectedDate)) {
      setLocalError(
        minDate && selectedDate < minDate
          ? "Date is too far in the past"
          : maxDate && selectedDate > maxDate
            ? "You must be at least 13 years old"
            : "Date is out of range",
      );
      return;
    }

    setDate(selectedDate);
    setInputValue(formatDate(selectedDate));
    setLocalError(undefined);
    setOpen(false);
    onChange?.(selectedDate);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputVal = e.target.value;

    // Remove any non-digit and non-slash characters
    inputVal = inputVal.replace(/[^\d/]/g, "");

    // Extract digits only to determine correct formatting
    const digitsOnly = inputVal.replace(/\D/g, "");

    // Limit to 8 digits (MMDDYYYY)
    if (digitsOnly.length > 8) {
      inputVal = formatInputWithSlashes(digitsOnly.slice(0, 8));
    } else {
      // Always auto-format based on digit count
      inputVal = formatInputWithSlashes(digitsOnly);
    }

    setInputValue(inputVal);

    // Try to parse MM/DD/YYYY format
    const mmddyyyyMatch = inputVal.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mmddyyyyMatch) {
      const [, monthStr, dayStr, yearStr] = mmddyyyyMatch;
      const month = parseInt(monthStr, 10);
      const day = parseInt(dayStr, 10);
      const year = parseInt(yearStr, 10);

      // Clear previous errors
      setLocalError(undefined);

      // Basic validation: year must be reasonable
      if (year < 1900 || year > 2100) {
        setLocalError("Please enter a valid year (1900-2100)");
        setDate(undefined);
        onChange?.(undefined);
        return;
      }

      // Month validation: must be 1-12
      if (month < 1 || month > 12) {
        setLocalError("Please enter a valid month (01-12)");
        setDate(undefined);
        onChange?.(undefined);
        return;
      }

      // Day validation: must be at least 1
      if (day < 1) {
        setLocalError("Please enter a valid day");
        setDate(undefined);
        onChange?.(undefined);
        return;
      }

      // Real calendar validation (handles leap years, month lengths, etc.)
      if (!isValidCalendarDate(year, month, day)) {
        setLocalError(
          `Invalid date: ${month.toString().padStart(2, "0")}/${day}/${year} does not exist in the calendar`,
        );
        setDate(undefined);
        onChange?.(undefined);
        return;
      }

      const parsedDate = new Date(year, month - 1, day);

      // Double-check the date is valid
      if (!isValidDate(parsedDate)) {
        setLocalError("Invalid date entered");
        setDate(undefined);
        onChange?.(undefined);
        return;
      }

      // Check age restrictions for manual input
      if (!isDateInRange(parsedDate)) {
        // Date is out of age range
        setLocalError(
          minDate && parsedDate < minDate
            ? "Date is too far in the past (maximum 120 years old)"
            : maxDate && parsedDate > maxDate
              ? "You must be at least 13 years old"
              : "Date is out of allowed range",
        );
        setDate(undefined);
        onChange?.(undefined);
        return;
      }

      // All validations passed - set the date
      setDate(parsedDate);
      setMonth(parsedDate);
      setLocalError(undefined);
      onChange?.(parsedDate);
    } else {
      // If input doesn't match format, clear the date but don't show error while typing
      if (date && inputVal.length >= 10) {
        // Only clear if they've finished typing
        setDate(undefined);
        onChange?.(undefined);
        setLocalError(undefined);
      }
    }
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {label && (
        <Label htmlFor={id} className="px-1">
          {label}
          {required && <span className="text-foreground ml-1">*</span>}
        </Label>
      )}
      <div className="relative flex gap-2">
        {/* Hidden input for form submission */}
        {name && (
          <input
            type="hidden"
            name={name}
            value={date ? date.toISOString().split("T")[0] : ""}
            required={required}
          />
        )}
        <Input
          id={id}
          value={inputValue}
          placeholder={placeholder}
          className="bg-background pr-10"
          onChange={handleInputChange}
          disabled={disabled}
          required={required}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
          aria-invalid={!!localError}
          aria-describedby={localError ? `${id}-error` : undefined}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              id={`${id}-picker`}
              variant="ghost"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
              disabled={disabled}
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Select date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={handleDateSelect}
              disabled={(date) => {
                if (maxDate && date > maxDate) return true;
                if (minDate && date < minDate) return true;
                return false;
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      {localError && (
        <p id={`${id}-error`} className="text-foreground text-xs">
          {localError}
        </p>
      )}
    </div>
  );
}

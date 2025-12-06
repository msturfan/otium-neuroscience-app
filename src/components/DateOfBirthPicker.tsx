"use client";

import * as React from "react";
import { DatePicker } from "@/components/ui/date-picker";

type DateOfBirthPickerProps = {
  id?: string;
  name?: string;
  value?: Date | undefined;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
};

export function DateOfBirthPicker({
  id = "dob",
  name = "dob",
  value,
  onChange,
  disabled = false,
  required = true,
  error,
}: DateOfBirthPickerProps) {
  // Calculate max date (13 years ago for age restriction)
  const maxDate = React.useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 13);
    return date;
  }, []);

  // Calculate min date (reasonable minimum - 120 years ago)
  const minDate = React.useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 120);
    return date;
  }, []);

  return (
    <DatePicker
      id={id}
      name={name}
      label="Date of Birth"
      placeholder="01/01/2000"
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      maxDate={maxDate}
      minDate={minDate}
      error={error}
    />
  );
}

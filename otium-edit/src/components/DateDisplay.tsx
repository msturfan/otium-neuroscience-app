"use client";

import * as React from "react";

export function DateDisplay() {
  const [date, setDate] = React.useState("");

  React.useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        month: "long",
        day: "2-digit",
      };
      setDate(now.toLocaleDateString("en-US", options));
    };

    updateDate();
    // Update date at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      updateDate();
      // Then update every 24 hours
      const interval = setInterval(updateDate, 24 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <span className="text-muted-foreground text-sm font-medium">{date}</span>
  );
}

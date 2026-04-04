"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

/** Match Neuroscience/Otium composer: `dark:bg-gray-900` + subtle border (Tailwind gray-900/800). */
const darkToastStyle = {
  "--border-radius": "var(--radius)",
  "--normal-bg": "rgb(17 24 39)",
  "--normal-bg-hover": "rgb(31 41 55)",
  "--normal-border": "rgb(31 41 55)",
  "--normal-border-hover": "rgb(55 65 81)",
  "--normal-text": "rgb(243 244 246)",
  "--success-bg": "rgb(17 24 39)",
  "--success-border": "rgb(31 41 55)",
  "--success-text": "rgb(243 244 246)",
  "--info-bg": "rgb(17 24 39)",
  "--info-border": "rgb(31 41 55)",
  "--info-text": "rgb(243 244 246)",
  "--warning-bg": "rgb(17 24 39)",
  "--warning-border": "rgb(31 41 55)",
  "--warning-text": "rgb(243 244 246)",
  "--error-bg": "rgb(17 24 39)",
  "--error-border": "rgb(31 41 55)",
  "--error-text": "rgb(243 244 246)",
} as React.CSSProperties;

const lightToastStyle = {
  "--normal-bg": "var(--popover)",
  "--normal-text": "var(--popover-foreground)",
  "--normal-border": "var(--border)",
  "--border-radius": "var(--radius)",
} as React.CSSProperties;

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Sonner
      theme={isDark ? "dark" : "light"}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={isDark ? darkToastStyle : lightToastStyle}
      {...props}
    />
  );
};

export { Toaster };

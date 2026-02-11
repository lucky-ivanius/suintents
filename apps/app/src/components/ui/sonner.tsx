"use client";

import type { ToasterProps } from "sonner";
import { AlertCircle, CancelCircleIcon, CheckmarkCircle02Icon, InformationCircleIcon, Loading02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-6" />,
        info: <HugeiconsIcon icon={InformationCircleIcon} className="size-6" />,
        warning: <HugeiconsIcon icon={AlertCircle} className="size-6" />,
        error: <HugeiconsIcon icon={CancelCircleIcon} className="size-6" />,
        loading: <HugeiconsIcon icon={Loading02Icon} className="size-6 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          content: "ml-2",
          title: "text-sm",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

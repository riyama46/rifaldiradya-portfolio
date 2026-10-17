import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeProps = {
  variant?: "soft" | "plain";
  className?: string;
  children: ReactNode;
};

const variants = {
  soft: "bg-accent/12 text-text",
  plain: "bg-text/8 text-text-muted",
};

export function Badge({ variant = "soft", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full px-3 text-small font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

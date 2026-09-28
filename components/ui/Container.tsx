import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ContainerProps = {
  className?: string;
  children: ReactNode;
};

// Max 1200px with a 16px (mobile) / 32px (desktop) gutter (PRD section 8).
export function Container({ className, children }: ContainerProps) {
  return (
    <div className={cn("mx-auto w-full max-w-[1200px] px-4 lg:px-8", className)}>{children}</div>
  );
}

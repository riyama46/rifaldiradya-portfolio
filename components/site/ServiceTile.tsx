import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

type ServiceTileProps = {
  variant: "primary" | "secondary";
  badge: string;
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
};

// Not clickable (App Flow S-01 section 2). Primary tile: amber border + shadow.
export function ServiceTile({
  variant,
  badge,
  title,
  description,
  children,
  className,
}: ServiceTileProps) {
  const isPrimary = variant === "primary";

  return (
    <div
      className={cn(
        "rounded-card p-6 lg:p-8",
        isPrimary ? "border-[1.5px] border-accent bg-surface" : "border border-border",
        className,
      )}
    >
      <Badge variant={isPrimary ? "soft" : "plain"}>{badge}</Badge>
      <h3 className={cn("mt-4", isPrimary ? "text-tile" : "text-card")}>{title}</h3>
      <p className="mt-2 max-w-[42ch] text-text-muted">{description}</p>
      {children}
    </div>
  );
}

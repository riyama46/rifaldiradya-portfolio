import { cn } from "@/lib/cn";

type StatusDotProps = {
  size?: "sm" | "md";
  className?: string;
};

export function StatusDot({ size = "sm", className }: StatusDotProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "status-dot relative inline-block shrink-0 rounded-full bg-success",
        size === "sm" ? "size-2" : "size-3",
        className,
      )}
    />
  );
}

import { cn } from "@/lib/cn";

type ArrowIconProps = {
  direction?: "up-right" | "right";
  className?: string;
};

// Nudges on hover of the nearest `group` ancestor (Button and links add `group`).
export function ArrowIcon({ direction = "up-right", className }: ArrowIconProps) {
  const isRight = direction === "right";

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        "size-[0.9em] shrink-0 transition-transform duration-200 ease-out",
        isRight
          ? "group-hover:translate-x-[3px]"
          : "group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
        className,
      )}
    >
      {isRight ? <path d="M3 8h10M9 4l4 4-4 4" /> : <path d="M5 11l6-6M6 5h5v5" />}
    </svg>
  );
}

import { cn } from "@/lib/cn";

type TagListProps = {
  tags: readonly string[];
  className?: string;
};

// Tech-stack pills; text is shown as-is and never translated (App Flow ProjectCard).
export function TagList({ tags, className }: TagListProps) {
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag) => (
        <li
          key={tag}
          className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-small font-medium"
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}

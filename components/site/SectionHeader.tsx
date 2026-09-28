import { cn } from "@/lib/cn";

type SectionHeaderProps = {
  number: string;
  label: string;
  title: string;
  titleId: string;
  className?: string;
};

// Thin rule + numbered label + H2 (PRD section 8). The label is a <p>, not a heading.
export function SectionHeader({ number, label, title, titleId, className }: SectionHeaderProps) {
  return (
    <div className={cn("relative pt-4", className)}>
      <span aria-hidden="true" className="draw-on-view absolute inset-x-0 top-0 h-px bg-border" />
      <p className="mb-3 flex gap-3 text-eyebrow font-medium text-text-muted uppercase">
        <b className="font-medium text-text">{number}</b>
        <span>{label}</span>
      </p>
      <h2 id={titleId} tabIndex={-1} className="text-heading outline-none">
        {title}
      </h2>
    </div>
  );
}

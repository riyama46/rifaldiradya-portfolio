import { StatusDot } from "@/components/ui/StatusDot";
import type { Dictionary } from "@/i18n";

// Brief → Build → Live (PRD section 4). The amber line fills in on scroll; the last step pulses.
export function ProcessSteps({ dict }: { dict: Dictionary }) {
  const steps = [
    { title: dict.steps["1"], desc: dict.steps["1d"] },
    { title: dict.steps["2"], desc: dict.steps["2d"] },
    { title: dict.steps["3"], desc: dict.steps["3d"] },
  ];

  return (
    <ol className="relative mt-7 grid grid-cols-3">
      <span
        aria-hidden="true"
        className="absolute top-[5px] right-[calc(33.333%-6px)] left-1.5 h-0.5 rounded-full bg-border"
      />
      <span
        aria-hidden="true"
        className="draw-on-view absolute top-[5px] right-[calc(33.333%-6px)] left-1.5 h-0.5 rounded-full bg-accent"
      />
      {steps.map((step, index) => (
        <li key={step.title} className="relative flex flex-col gap-2.5 pr-2">
          {index === steps.length - 1 ? (
            <StatusDot size="md" />
          ) : (
            <span
              aria-hidden="true"
              className="relative size-3 rounded-full border-2 border-accent bg-surface-raised"
            />
          )}
          <span className="text-small font-medium">{step.title}</span>
          <span className="-mt-1.5 text-small text-text-muted">{step.desc}</span>
        </li>
      ))}
    </ol>
  );
}

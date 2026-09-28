import { TagList } from "@/components/ui/TagList";
import { interpolate, type Dictionary } from "@/i18n";
import { siteConfig } from "@/lib/site-config";

// Factual, quotable profile block (PRD section 9, GEO). Two columns from 768px.
export function AboutFacts({ dict }: { dict: Dictionary }) {
  const facts = [
    {
      label: dict.facts.basedLabel,
      value: interpolate(dict.facts.based, { timezone: siteConfig.timezoneLabel }),
    },
    { label: dict.facts.workLabel, value: dict.facts.work },
    { label: dict.facts.focusLabel, value: dict.facts.focus },
    { label: dict.facts.langLabel, value: dict.facts.lang },
  ];

  const labelClass = "text-eyebrow font-medium text-text-muted uppercase";

  return (
    <dl className="mt-3 grid gap-x-8 md:grid-cols-2">
      {facts.map((fact) => (
        <div key={fact.label} className="border-t border-border py-3.5">
          <dt className={labelClass}>{fact.label}</dt>
          <dd className="mt-1 text-base font-medium">{fact.value}</dd>
        </div>
      ))}
      <div className="border-t border-border py-3.5 md:col-span-2">
        <dt className={labelClass}>{dict.facts.stackLabel}</dt>
        <dd className="mt-2">
          <TagList tags={siteConfig.stack} />
        </dd>
      </div>
    </dl>
  );
}

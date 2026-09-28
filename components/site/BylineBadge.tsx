import { siteConfig } from "@/lib/site-config";

// Author signature above the headline. Shows the "RR" initials until a photo asset exists (PRD F1).
export function BylineBadge() {
  return (
    <div className="mb-5 inline-flex items-center gap-3 lg:mb-8 lg:ml-1.5">
      <div
        aria-hidden="true"
        className="grid size-16 shrink-0 place-items-center rounded-full bg-accent-soft font-display text-[1.375rem] font-semibold shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-accent)_25%,transparent)] lg:size-18 lg:text-2xl"
      >
        {siteConfig.initials}
      </div>
      <div className="leading-tight">
        <p className="text-[0.9375rem] font-medium">{siteConfig.name}</p>
        <p className="text-small text-text-muted">{siteConfig.role}</p>
      </div>
    </div>
  );
}

import { StatusDot } from "@/components/ui/StatusDot";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/cn";
import { siteConfig } from "@/lib/site-config";

const dot =
  "before:mx-3 before:inline-block before:size-[3px] before:rounded-full before:bg-border before:content-['']";
const dotFromMd =
  "md:before:mx-3 md:before:inline-block md:before:size-[3px] md:before:rounded-full md:before:bg-border md:before:content-['']";

// Verifiable facts only (PRD section 4). "Available" is controlled by siteConfig.availableForWork
// and sits on its own line on mobile.
export function MetaRow({ dict }: { dict: Dictionary }) {
  const available = siteConfig.availableForWork;

  return (
    <ul className="mt-7 flex flex-wrap items-center gap-y-1.5 text-small font-medium text-text-muted lg:mt-10">
      {available && (
        <li className="inline-flex items-center gap-2 text-text max-md:basis-full">
          <StatusDot />
          {dict.meta.available}
        </li>
      )}
      <li className={cn("inline-flex items-center", available && dotFromMd)}>
        {dict.meta.location}
      </li>
      <li className={cn("inline-flex items-center", dot)}>{dict.meta.remote}</li>
      <li className={cn("inline-flex items-center", dot)}>EN / ID</li>
    </ul>
  );
}

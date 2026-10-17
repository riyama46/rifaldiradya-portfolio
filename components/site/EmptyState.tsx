import type { Dictionary } from "@/i18n";

// E-01: never an empty page. The text points at the closing Contact chapter below (#more on Work).
export function EmptyState({ dict, target }: { dict: Dictionary; target: string }) {
  return (
    <div className="work-empty">
      <p>{dict.work.empty}</p>
      <a className="line-link" href={target}>
        {dict.bridge.go}
      </a>
    </div>
  );
}

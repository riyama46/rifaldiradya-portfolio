import type { PublicAvatar } from "@/lib/images/store";
import { siteConfig } from "@/lib/site-config";

const circle =
  "size-16 shrink-0 rounded-full shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-accent)_25%,transparent)] lg:size-18";

// Author signature above the headline (PRD F1): the profile photo set in the admin (S-14), or the
// "RR" initials when there is none. Decorative next to the visible name, so alt is empty.
export function BylineBadge({ avatar }: { avatar: PublicAvatar | null }) {
  return (
    <div className="mb-5 inline-flex items-center gap-3 lg:mb-8 lg:ml-1.5">
      {avatar ? (
        // A plain <img>: two fixed widths (160/320) cover 1–3× screens at 64/72 px, no loader needed.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar.src}
          srcSet={avatar.srcSet}
          sizes="(min-width: 1024px) 72px, 64px"
          width={72}
          height={72}
          alt=""
          decoding="async"
          className={`${circle} bg-accent-soft object-cover`}
        />
      ) : (
        <div
          aria-hidden="true"
          className={`${circle} grid place-items-center bg-accent-soft font-display text-[1.375rem] font-semibold lg:text-2xl`}
        >
          {siteConfig.initials}
        </div>
      )}
      <div className="leading-tight">
        <p className="text-[0.9375rem] font-medium">{siteConfig.name}</p>
        <p className="text-small text-text-muted">{siteConfig.role}</p>
      </div>
    </div>
  );
}

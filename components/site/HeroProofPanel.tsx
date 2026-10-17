"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ProjectThumbnail } from "@/components/site/ProjectThumbnail";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { StatusDot } from "@/components/ui/StatusDot";
import { cn } from "@/lib/cn";
import type { PublicProject, ScreenshotVisual } from "@/lib/projects/public";

export type ProofSlide = Pick<PublicProject, "id" | "slug" | "title"> & {
  liveUrl: string;
  /** Host shown in the browser frame, e.g. "staging0.rifaldiradya.com". */
  liveHost: string;
  thumbnail: ScreenshotVisual | null;
  /** "Visit {title} (opens in new tab)", resolved on the server so the dictionary stays there. */
  ariaLabel: string;
};

type HeroProofPanelProps = {
  slides: ProofSlide[];
  labels: { proofLabel: string; visitShort: string; live: string; pause: string; play: string };
};

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const noop = () => () => {};

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

// App Flow HeroProofPanel + SDD section 8. Timing is a CSS animation on the active progress bar;
// its `animationend` advances the slide, so pause/hover/focus/reduced motion are pure CSS states.
export function HeroProofPanel({ slides, labels }: HeroProofPanelProps) {
  const isClient = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loadRest, setLoadRest] = useState(false);

  // Slide 2+ images load after the page is idle, before the first rotation (SDD section 7).
  useEffect(() => {
    if (slides.length < 2) return;
    const load = () => setLoadRest(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(load, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(load, 2000);
    return () => clearTimeout(id);
  }, [slides.length]);

  const rotates = isClient && slides.length > 1;
  const current = slides[active];

  return (
    <div
      className={cn(
        "hero-proof relative w-full max-w-[560px] pr-2.5 lg:ml-auto lg:pr-0",
        (paused || reducedMotion) && "is-paused",
      )}
    >
      <div className="proof-stack relative">
        <a
          href={current.liveUrl}
          data-track="project_link_click"
          data-slug={current.slug}
          data-placement="hero_panel"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={current.ariaLabel}
          className="relative block overflow-hidden rounded-card border border-border bg-surface transition-[transform,box-shadow] duration-240 ease-out motion-safe:hover:-translate-y-0.5"
        >
          <div
            aria-hidden="true"
            className="flex h-9 items-center gap-1.5 border-b border-border bg-surface px-3"
          >
            <i className="size-2.5 rounded-full bg-border" />
            <i className="size-2.5 rounded-full bg-border" />
            <i className="size-2.5 rounded-full bg-border" />
            <span
              key={`url-${active}`}
              className="fade-in ml-2.5 min-w-0 flex-1 truncate rounded-md border border-border bg-surface px-2.5 py-0.5 text-[0.8125rem] text-text-muted"
            >
              {current.liveHost}
            </span>
            <span className="ml-2 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-success">
              <StatusDot />
              {labels.live}
            </span>
          </div>
          <div aria-hidden="true" className="grid aspect-[16/10] bg-surface">
            {slides.map((slide, index) =>
              index === 0 || loadRest ? (
                <div
                  key={slide.id}
                  className={cn("proof-slide [grid-area:1/1]", index === active && "is-active")}
                >
                  <ProjectThumbnail
                    title={slide.title}
                    thumbnail={slide.thumbnail}
                    sizes="(min-width: 1024px) 560px, 100vw"
                    priority={index === 0}
                  />
                </div>
              ) : null,
            )}
          </div>
        </a>
      </div>

      <div className="mt-3.5 flex items-baseline justify-between gap-4 text-[0.9375rem]">
        <span key={`title-${active}`} className="fade-in">
          <span className="text-small text-text-muted">{labels.proofLabel}</span> ·{" "}
          <strong className="font-medium">{current.title}</strong>
        </span>
        <a
          href={current.liveUrl}
          data-track="project_link_click"
          data-slug={current.slug}
          data-placement="hero_panel"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={current.ariaLabel}
          className="group inline-flex items-center gap-1 font-medium whitespace-nowrap underline decoration-border decoration-2 underline-offset-4 hover:decoration-accent"
        >
          {labels.visitShort}
          <ArrowIcon />
        </a>
      </div>

      {rotates && (
        <div className="mt-2.5 flex items-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-pressed={index === active}
              aria-label={`${String(index + 1).padStart(2, "0")} · ${slide.title}`}
              onClick={() => setActive(index)}
              className={cn(
                "flex min-h-11 flex-1 cursor-pointer flex-col justify-center gap-1.5 text-left text-[0.8125rem] font-medium tracking-wide",
                index === active ? "text-text" : "text-text-muted hover:text-text",
              )}
            >
              <span className="relative h-0.5 overflow-hidden rounded-full bg-border">
                {index === active ? (
                  <span
                    key={`fill-${active}`}
                    className="proof-fill absolute inset-0 bg-text"
                    onAnimationEnd={() => setActive((active + 1) % slides.length)}
                  />
                ) : (
                  index < active && <span className="absolute inset-0 bg-text-muted" />
                )}
              </span>
              {String(index + 1).padStart(2, "0")}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? labels.play : labels.pause}
            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-button border border-transparent text-text-muted hover:border-border hover:text-text"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-4">
              {paused ? (
                <path d="M7 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L8.5 4.64A1 1 0 0 0 7 5.5z" />
              ) : (
                <>
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </>
              )}
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

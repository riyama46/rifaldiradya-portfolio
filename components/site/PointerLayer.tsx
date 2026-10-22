"use client";

import { useEffect, useRef } from "react";
import type { Dictionary } from "@/i18n";

const CLASSES = ["has-cursor", "cur-on", "cur-hot", "cur-label", "cur-down", "peek-on"];

const put = (element: HTMLElement, x: number, y: number) => {
  element.style.transform = `translate3d(${x}px,${y}px,0)`;
};

// O-05 (option-b.html "cursor"): dot, a ring that lags and carries the Read/Visit label, a light
// that follows with the colour of the chapter in the middle of the screen, the preview next to the
// cursor and the screenshot tilt. Mouse only (D-31); the one requestAnimationFrame loop of the site
// stops once everything has caught up (D-32). All aria-hidden: links keep their own text (D-35).
export function PointerLayer({ labels }: { labels: Dictionary["cur"] }) {
  const spotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const [spot, ring, word, dot] = [
      spotRef.current,
      ringRef.current,
      wordRef.current,
      dotRef.current,
    ];
    if (!spot || !ring || !word || !dot) return;
    const html = document.documentElement;
    const peek = document.querySelector<HTMLElement>(".peek");
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    const events = new AbortController();
    const options = { signal: events.signal, passive: true };
    html.classList.add("has-cursor");

    // D-33: the chapter across the middle of the screen sets the light; no scroll listener.
    const zones = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) html.dataset.zone = (entry.target as HTMLElement).dataset.zone;
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    document.querySelectorAll("main [data-zone]").forEach((zone) => zones.observe(zone));

    let x = 0;
    let y = 0;
    let sx = 0;
    let sy = 0;
    let rx = 0;
    let ry = 0;
    let raf = 0;
    let seen = false;
    let shot: HTMLElement | null = null;
    let item: Element | null = null;

    const frame = () => {
      // D-34: with reduced motion everything sits on the cursor, no lag.
      const ks = still.matches ? 1 : 0.1;
      const kr = still.matches ? 1 : 0.28;
      sx += (x - sx) * ks;
      sy += (y - sy) * ks;
      rx += (x - rx) * kr;
      ry += (y - ry) * kr;
      put(spot, sx, sy);
      put(ring, rx, ry);
      if (peek) put(peek, rx + (rx > innerWidth - 400 ? -372 : 32), Math.max(16, ry - 120));
      const gap = Math.abs(x - sx) + Math.abs(y - sy) + Math.abs(x - rx) + Math.abs(y - ry);
      raf = gap > 0.4 ? requestAnimationFrame(frame) : 0;
    };

    const untilt = () => {
      shot?.style.removeProperty("--rx");
      shot?.style.removeProperty("--ry");
      shot = null;
    };

    const hide = () => {
      html.classList.remove("cur-on", "cur-hot", "cur-label", "peek-on");
      untilt();
      seen = false;
    };

    const move = (event: PointerEvent) => {
      // E-34: a touch or pen hides the layer until the mouse moves again.
      if (event.pointerType !== "mouse") return hide();
      x = event.clientX;
      y = event.clientY;
      put(dot, x, y);
      if (!seen) {
        seen = true;
        sx = rx = x;
        sy = ry = y;
        html.classList.add("cur-on");
      }

      const target = event.target instanceof Element ? event.target : null;
      const labelled = target?.closest<HTMLElement>("[data-cursor]");
      if (labelled)
        word.textContent = labelled.dataset.cursor === "visit" ? labels.visit : labels.read;
      html.classList.toggle("cur-label", !!labelled);
      html.classList.toggle("cur-hot", !labelled && !!target?.closest("a, button, summary"));

      const key = target?.closest<HTMLElement>("[data-preview]")?.dataset.preview;
      const next = key ? (peek?.querySelector(`[data-k="${CSS.escape(key)}"]`) ?? null) : null;
      if (next !== item) {
        item?.classList.remove("on");
        next?.classList.add("on");
        item = next;
      }
      html.classList.toggle("peek-on", !!next);

      const over = target?.closest<HTMLElement>(".shot") ?? null;
      if (over !== shot) untilt();
      if (over && !still.matches) {
        shot = over;
        const box = over.getBoundingClientRect();
        over.style.setProperty("--ry", `${((x - box.left) / box.width - 0.5) * 8}deg`);
        over.style.setProperty("--rx", `${(0.5 - (y - box.top) / box.height) * 6}deg`);
      }
      if (!raf) raf = requestAnimationFrame(frame);
    };

    addEventListener("pointermove", move, options);
    addEventListener(
      "pointerdown",
      (event) => (event.pointerType === "mouse" ? html.classList.add("cur-down") : hide()),
      options,
    );
    addEventListener("pointerup", () => html.classList.remove("cur-down"), options);
    document.addEventListener("mouseout", (event) => event.relatedTarget || hide(), options);
    // D-35: keyboard focus brings the system cursor back until the mouse moves again.
    document.addEventListener(
      "focusin",
      (event) =>
        event.target instanceof Element && event.target.matches(":focus-visible") && hide(),
      options,
    );

    return () => {
      events.abort();
      zones.disconnect();
      cancelAnimationFrame(raf);
      hide();
      item?.classList.remove("on");
      html.classList.remove(...CLASSES);
      delete html.dataset.zone;
    };
  }, [labels]);

  return (
    <>
      <div ref={spotRef} className="spot" aria-hidden="true">
        <i />
      </div>
      <div ref={ringRef} className="cur-ring" aria-hidden="true">
        <i />
        <b ref={wordRef} />
      </div>
      <div ref={dotRef} className="cur-dot" aria-hidden="true" />
    </>
  );
}

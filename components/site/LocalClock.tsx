"use client";

import { useSyncExternalStore } from "react";
import { siteConfig } from "@/lib/site-config";

const formatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: siteConfig.timezone,
});

function subscribe(onChange: () => void) {
  const timer = window.setInterval(onChange, 15_000);
  return () => window.clearInterval(timer);
}

const now = () => formatter.format(new Date());
const beforeMount = () => null;

// S-01 bab 5: "GMT+7" before JS (E-07), then "HH:mm GMT+7" in Asia/Jakarta. Same line, same
// width class (tabular numerals), so the swap causes no layout shift.
export function LocalClock({ className }: { className?: string }) {
  const time = useSyncExternalStore(subscribe, now, beforeMount);

  return (
    <p className={className}>
      {time && <time>{time} </time>}
      {siteConfig.timezoneLabel}
    </p>
  );
}

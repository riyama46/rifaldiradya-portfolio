"use client";

import { useEffect, useState, type ComponentType } from "react";
import type { Dictionary } from "@/i18n";

type Labels = Dictionary["cur"];
type Layer = ComponentType<{ labels: Labels }>;

const MOUSE = "(hover: hover) and (pointer: fine)";

// D-31 / D-32: loads PointerLayer after idle and only while a mouse is the pointer, so its chunk is
// never requested on phones and tablets. Unmounting it (the query stops matching) cleans up.
export function Pointer({ labels }: { labels: Labels }) {
  const [mouse, setMouse] = useState(false);
  const [layer, setLayer] = useState<{ Layer: Layer } | null>(null);

  useEffect(() => {
    const query = matchMedia(MOUSE);
    const sync = () => setMouse(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!mouse || layer) return;
    const load = () =>
      void import("@/components/site/PointerLayer").then(({ PointerLayer }) =>
        setLayer({ Layer: PointerLayer }),
      );
    // Safari has no requestIdleCallback.
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(load);
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(load, 200);
    return () => clearTimeout(id);
  }, [mouse, layer]);

  return mouse && layer ? <layer.Layer labels={labels} /> : null;
}

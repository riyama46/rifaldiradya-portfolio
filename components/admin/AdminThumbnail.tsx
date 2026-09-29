"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * 64 × 40 thumbnail for S-11. Decorative (the title sits next to it), so alt is empty.
 * No image yet (E-17) or a failed load shows the plain grey block.
 */
export function AdminThumbnail({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="h-10 w-16 shrink-0 overflow-hidden rounded-[6px] border border-border bg-surface">
      {url && !failed && (
        <Image
          src={url}
          alt=""
          width={64}
          height={40}
          sizes="64px"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      )}
    </div>
  );
}

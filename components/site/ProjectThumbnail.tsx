"use client";

import Image from "next/image";
import { useState } from "react";
import type { PublicProject } from "@/lib/projects/public";

type ProjectThumbnailProps = {
  title: string;
  thumbnail: PublicProject["thumbnail"];
  sizes: string;
  priority?: boolean;
  className?: string;
};

/** E-05 / E-17: a surface block with the title when there is no image or it fails to load. */
function ThumbnailPlaceholder({ title }: { title: string }) {
  return (
    <div className="grid size-full place-items-center bg-surface p-4 text-center font-display text-card text-balance text-text-muted">
      {title}
    </div>
  );
}

export function ProjectThumbnail({
  title,
  thumbnail,
  sizes,
  priority = false,
  className,
}: ProjectThumbnailProps) {
  const [failed, setFailed] = useState(false);

  if (!thumbnail || failed) return <ThumbnailPlaceholder title={title} />;

  return (
    <Image
      src={thumbnail.url}
      width={thumbnail.width}
      height={thumbnail.height}
      alt={thumbnail.alt}
      sizes={sizes}
      // Next.js 16 deprecates `priority`; eager + high fetch priority is the documented choice for
      // images that are the LCP element only on some viewports (hero panel: desktop yes, mobile no).
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      onError={() => setFailed(true)}
      className={className ?? "size-full object-cover"}
    />
  );
}

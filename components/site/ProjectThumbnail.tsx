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
      priority={priority}
      onError={() => setFailed(true)}
      className={className ?? "size-full object-cover"}
    />
  );
}

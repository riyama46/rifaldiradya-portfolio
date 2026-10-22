import { ProjectThumbnail } from "@/components/site/ProjectThumbnail";
import type { PublicProject } from "@/lib/projects/public";

// O-05: the previews the pointer layer shows next to the cursor, one per project with a valid
// visual (E-33: none otherwise), keyed by slug like the trigger's data-preview. Rendered by the
// server so no fetch is needed; hidden until the layer is active, so the lazy images never load
// on touch screens.
export function PointerPeek({ projects }: { projects: PublicProject[] }) {
  const items = projects.filter((project) => project.visual);
  if (items.length === 0) return null;

  return (
    <div className="peek" aria-hidden="true">
      {items.map(({ slug, title, visual }) =>
        visual?.type === "number" ? (
          <div key={slug} className="peek-card" data-k={slug}>
            <b>{visual.number}</b>
            <span>{visual.caption}</span>
          </div>
        ) : (
          <div key={slug} data-k={slug}>
            <ProjectThumbnail title={title} thumbnail={visual} sizes="340px" className="peek-pic" />
          </div>
        ),
      )}
    </div>
  );
}

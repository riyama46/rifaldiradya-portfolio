import { ProjectThumbnail } from "@/components/site/ProjectThumbnail";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { Button } from "@/components/ui/Button";
import { StatusDot } from "@/components/ui/StatusDot";
import { TagList } from "@/components/ui/TagList";
import { interpolate, type Dictionary } from "@/i18n";
import type { PublicProject } from "@/lib/projects/public";

type ProjectCardProps = {
  project: PublicProject;
  dict: Dictionary;
  sizes: string;
  priority?: boolean;
};

// App Flow ProjectCard: only the thumbnail and the button link out (same URL); the card itself is
// not one big link.
export function ProjectCard({ project, dict, sizes, priority }: ProjectCardProps) {
  const visitLabel = interpolate(dict.card.visitAria, { title: project.title });

  return (
    <article className="group/card flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface-raised shadow-card transition-[transform,box-shadow] duration-240 ease-out hover:shadow-card-hover motion-safe:hover:-translate-y-[3px]">
      <a
        href={project.liveUrl}
        data-track="project_link_click"
        data-slug={project.slug}
        data-placement="card"
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={-1}
        aria-hidden="true"
        className="block aspect-[16/10] overflow-hidden border-b border-border bg-surface"
      >
        <ProjectThumbnail
          title={project.title}
          thumbnail={project.thumbnail}
          sizes={sizes}
          priority={priority}
          className="size-full object-cover transition-transform duration-400 ease-out motion-safe:group-hover/card:scale-[1.03]"
        />
      </a>
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <span className="inline-flex items-center gap-2 text-small font-medium text-success">
          <StatusDot />
          {dict.card.live}
        </span>
        <h3 className="line-clamp-2 text-card">{project.title}</h3>
        <p className="text-base text-text-muted">{project.summary}</p>
        {project.tags.length > 0 && <TagList tags={project.tags} className="mt-0.5 mb-1.5" />}
        <Button
          href={project.liveUrl}
          data-track="project_link_click"
          data-slug={project.slug}
          data-placement="card"
          external
          variant="secondary"
          aria-label={visitLabel}
          className="mt-auto self-start"
        >
          {dict.card.visit}
          <ArrowIcon />
        </Button>
      </div>
    </article>
  );
}

import { ProjectCard } from "@/components/site/ProjectCard";
import type { Dictionary } from "@/i18n";
import { cn } from "@/lib/cn";
import { gridColumnsClass, type PublicProject } from "@/lib/projects/public";

type ProjectGridProps = {
  projects: PublicProject[];
  dict: Dictionary;
  /** S-02 loads the first card eagerly; on the homepage the hero panel image is the priority. */
  priorityFirst?: boolean;
};

// Vertical grid: 1 column, 2 from 768px, 3 from 1200px only with 3+ cards (App Flow S-02, E-04).
export function ProjectGrid({ projects, dict, priorityFirst = false }: ProjectGridProps) {
  const threeColumns = projects.length >= 3;
  const sizes = threeColumns
    ? "(min-width: 1200px) 33vw, (min-width: 768px) 50vw, 100vw"
    : "(min-width: 768px) 50vw, 100vw";

  return (
    <ul className={cn("grid gap-6", gridColumnsClass(projects.length))}>
      {projects.map((project, index) => (
        <li key={project.id} className={cn("reveal", index % 3 !== 0 && "reveal-late")}>
          <ProjectCard
            project={project}
            dict={dict}
            sizes={sizes}
            priority={priorityFirst && index === 0}
          />
        </li>
      ))}
    </ul>
  );
}

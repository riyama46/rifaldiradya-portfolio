import type { CSSProperties } from "react";
import { ChapterDepth } from "@/components/site/ChapterDepth";
import { ProjectThumbnail } from "@/components/site/ProjectThumbnail";
import { localePath, type Dictionary, type Locale } from "@/i18n";
import { screenshotOf, selectedWorkRanges, type PublicProject } from "@/lib/projects/public";

type SelectedWorkProps = {
  lang: Locale;
  dict: Dictionary;
  /** Published + show_on_home, in admin order, at most 5 (D-18). Never empty: E-25 skips the chapter. */
  projects: PublicProject[];
};

// Lint "numbering" defended: the 0n / 0N counter is the spec (D-04, AC-2). taste-skill-ignore
const pad = (n: number) => String(n).padStart(2, "0");

// Delta APP_FLOW S-01 bab 2 (option-b.html .work). With 2+ projects the stage is pinned and each
// project is one scroll step (CSS view timeline, ranges from selectedWorkRanges); without
// scroll-driven support or with reduced motion it is a plain stacked list (E-30). `data-cursor`
// and `data-preview` are read by the pointer layer (O-05).
export function SelectedWork({ lang, dict, projects }: SelectedWorkProps) {
  const total = pad(projects.length);
  const ranges = selectedWorkRanges(projects.length);
  const pinned = ranges.length > 0;
  const step = (index: number) =>
    pinned ? ({ "--r0": ranges[index].r0, "--r1": ranges[index].r1 } as CSSProperties) : undefined;

  return (
    <section
      id="work"
      data-zone="work"
      aria-labelledby="work-h"
      className={pinned ? "work is-pinned" : "work"}
    >
      <div className="work-stage">
        <ChapterDepth />
        <div className="work-head">
          <h2 id="work-h" className="ch-label">
            {dict.work.h}
          </h2>
          {pinned && (
            <p className="ch-label work-count" aria-hidden="true">
              <span className="cn">
                {projects.map((project, index) => (
                  <b key={project.id} style={step(index)}>
                    {pad(index + 1)}
                  </b>
                ))}
              </span>{" "}
              / {total}
            </p>
          )}
        </div>

        <div className="work-list">
          {projects.map((project, index) => {
            const shot = screenshotOf(project);
            const site = project.liveUrl;
            const label = [project.meta, project.side].filter(Boolean).join(" · ");
            return (
              <article key={project.id} className="proj" style={step(index)}>
                <div className={shot ? "proj-pin has-pic" : "proj-pin"}>
                  <div>
                    <p className="ch-label proj-label">
                      <span className="pn">
                        {pad(index + 1)} / {total}
                        {label && " · "}
                      </span>
                      {label}
                    </p>
                    <h3 className="wt">
                      <a
                        className="wt-a"
                        href={localePath(`/work#case-${project.slug}`, lang)}
                        data-track="case_open"
                        data-source="home_title"
                        data-slug={project.slug}
                        data-cursor="read"
                        data-preview={project.slug}
                      >
                        {/* The arrow sits in the text so it follows the last word when the title wraps. */}
                        <span>
                          {project.title}
                          <i className="go" aria-hidden="true">
                            →
                          </i>
                        </span>
                      </a>
                    </h3>
                    <p className="wd">{project.summary}</p>
                    {site && (
                      <div className="proj-links">
                        <a
                          className="line-link"
                          href={site}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-track="project_link_click"
                          data-slug={project.slug}
                          data-placement="home"
                          data-cursor="visit"
                        >
                          {dict.work.open}
                        </a>
                      </div>
                    )}
                  </div>
                  {shot &&
                    (site ? (
                      // Same target as the "Open the live site" link: kept out of the tab order.
                      <a
                        className="shot"
                        href={site}
                        target="_blank"
                        rel="noopener noreferrer"
                        tabIndex={-1}
                        aria-hidden="true"
                        data-track="project_link_click"
                        data-slug={project.slug}
                        data-placement="home"
                        data-cursor="visit"
                      >
                        <ProjectThumbnail
                          title={project.title}
                          thumbnail={shot}
                          sizes="(min-width: 768px) 55vw, 100vw"
                          className="pic"
                        />
                      </a>
                    ) : (
                      <div className="shot">
                        <ProjectThumbnail
                          title={project.title}
                          thumbnail={shot}
                          sizes="(min-width: 768px) 55vw, 100vw"
                          className="pic"
                        />
                      </div>
                    ))}
                </div>
              </article>
            );
          })}
        </div>

        <div className="work-foot">
          {pinned && (
            <ol className="rail" aria-label={dict.work.rail}>
              {projects.map((project, index) => (
                <li key={project.id} style={step(index)}>
                  <a href={`#w${index + 1}`}>{project.title}</a>
                </li>
              ))}
            </ol>
          )}
          <a className="line-link" href={localePath("/work", lang)}>
            {dict.work.all}
          </a>
        </div>
      </div>

      {pinned && (
        <div className="marks" aria-hidden="true">
          {projects.map((project, index) => (
            <i key={project.id} id={`w${index + 1}`} />
          ))}
        </div>
      )}
    </section>
  );
}

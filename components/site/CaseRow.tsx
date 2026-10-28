import { MailtoLink } from "@/components/site/MailtoLink";
import type { Dictionary } from "@/i18n";
import type { PublicProject } from "@/lib/projects/public";

type CaseRowProps = {
  dict: Dictionary;
  project: PublicProject;
};

// Delta APP_FLOW S-02 step 3 (option-b.html .row). Native <details> (D-24): the row opens without
// JS (E-07). Case parts that are still empty are hidden; without a case text the summary stands in
// (E-27). E-28 (site without a URL) is already "none" in the DTO. Opening by click is tracked as
// case_open `row` through the data attributes on <summary>.
export function CaseRow({ dict, project }: CaseRowProps) {
  const { c } = dict;
  const intro = project.caseIs ?? project.summary;
  const site = project.liveUrl;
  const walkthrough = project.caseAction === "walkthrough";
  // D-42: optional links after the case button, demo first.
  const links = [
    { url: project.demoUrl, link: "demo", label: dict.work.demo },
    { url: project.repoUrl, link: "code", label: c.code },
  ].filter((item): item is typeof item & { url: string } => item.url !== null);
  const hasActions = Boolean(site) || walkthrough || links.length > 0;
  const hasDetails = project.stack.length > 0 || project.status !== null || hasActions;

  return (
    <li className="row" data-group={project.group}>
      <details id={`case-${project.slug}`} className="case">
        <summary
          className="row-head"
          data-track="case_open"
          data-source="row"
          data-slug={project.slug}
          data-cursor="read"
          data-preview={project.slug}
        >
          <span className="row-t">{project.title}</span>
          {project.meta && <span className="row-m">{project.meta}</span>}
          {project.side && <span className="row-y">{project.side}</span>}
          <span className="pm" aria-hidden="true" />
        </summary>

        <div className="cols">
          <div>
            <p className="ch-label">{c.is}</p>
            <p className="val">{intro}</p>
          </div>
          {project.caseDid.length > 0 && (
            <div>
              <p className="ch-label">{c.did}</p>
              <ul>
                {project.caseDid.map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            </div>
          )}
          {hasDetails && (
            <div>
              {project.stack.length > 0 && (
                <>
                  <p className="ch-label">{c.stack}</p>
                  <p className="val">{project.stack.join(" · ")}</p>
                </>
              )}
              {project.status && (
                <>
                  <p className="ch-label">{c.status}</p>
                  <p className="val">{project.status}</p>
                </>
              )}
              {hasActions && (
                <div className="case-acts">
                  {site && (
                    <a
                      className="line-link case-act"
                      href={site}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-track="project_link_click"
                      data-slug={project.slug}
                      data-placement="case"
                      data-cursor="visit"
                    >
                      {dict.work.open}
                    </a>
                  )}
                  {walkthrough && (
                    <MailtoLink
                      dict={dict}
                      kind="walkthrough"
                      location="case"
                      project={{ title: project.title, slug: project.slug }}
                      variant="soft"
                      className="case-act"
                    >
                      {c.walk}
                    </MailtoLink>
                  )}
                  {links.map(({ url, link, label }) => (
                    <a
                      key={link}
                      className="line-link case-act"
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-track="project_link_click"
                      data-slug={project.slug}
                      data-placement="case"
                      data-link={link}
                      data-cursor="visit"
                    >
                      {label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </details>
    </li>
  );
}

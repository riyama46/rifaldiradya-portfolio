import type { Metadata } from "next";
import { CaseRow } from "@/components/site/CaseRow";
import { ChapterDepth } from "@/components/site/ChapterDepth";
import { ContactChapter } from "@/components/site/ContactChapter";
import { EmptyState } from "@/components/site/EmptyState";
import { Footer } from "@/components/site/Footer";
import { JsonLd } from "@/components/site/JsonLd";
import { SiteBar } from "@/components/site/SiteBar";
import { WorkFilter } from "@/components/site/WorkFilter";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/server";
import { groupCounts, toPublicProject } from "@/lib/projects/public";
import { getPublishedProjects } from "@/lib/projects/queries";
import { workJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata, siteOrigin } from "@/lib/seo/metadata";

export const revalidate = 300;

const LIST_ID = "cases";

export async function generateMetadata({ params }: PageProps<"/[lang]/work">): Promise<Metadata> {
  const lang = await resolveLocale(params);
  const dict = getDictionary(lang);
  return buildMetadata({ lang, path: "/work", page: dict.seo.work, dict });
}

// Delta APP_FLOW S-02: label → H1 with the count → sub → filter → case rows (published, in admin
// order, no limit) → closing Contact #more → footer. 0 projects → E-01.
export default async function WorkPage({ params }: PageProps<"/[lang]/work">) {
  const lang = await resolveLocale(params);
  const dict = getDictionary(lang);
  const projects = (await getPublishedProjects()).map((project) => toPublicProject(project, lang));
  const { wp, group } = dict;

  return (
    <>
      <JsonLd data={workJsonLd(lang, siteOrigin(), dict.nav.work, projects)} />
      <SiteBar lang={lang} dict={dict} path="/work" />
      <main id="content" tabIndex={-1}>
        <section id="all" data-zone="all" aria-labelledby="all-h" className="chapter ch workpage">
          <ChapterDepth />
          <div className="ch-inner">
            <p className="ch-label">{wp.label}</p>
            <h1 id="all-h" className="wp-title">
              {dict.nav.work}
              {projects.length > 0 && <sup>{projects.length}</sup>}
            </h1>
            <p className="wp-sub">{wp.sub}</p>

            {projects.length > 0 ? (
              <>
                <WorkFilter
                  listId={LIST_ID}
                  lang={lang}
                  total={projects.length}
                  groups={groupCounts(projects)}
                  labels={{ group: wp.filter, all: wp.all, ...group }}
                />
                <ol id={LIST_ID} className="rows">
                  {projects.map((project) => (
                    <CaseRow key={project.id} dict={dict} project={project} />
                  ))}
                </ol>
              </>
            ) : (
              <EmptyState dict={dict} target="#more" />
            )}
          </div>
        </section>
        <ContactChapter dict={dict} variant="more" />
      </main>
      <Footer lang={lang} dict={dict} back="home" />
    </>
  );
}

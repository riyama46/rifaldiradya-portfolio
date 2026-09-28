import { EmptyState } from "@/components/site/EmptyState";
import { ProjectGrid } from "@/components/site/ProjectGrid";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/server";
import { mailtoHref } from "@/lib/site-config";
import { toPublicProject } from "@/lib/projects/public";
import { getPublishedProjects } from "@/lib/projects/queries";

export const revalidate = 300;

// S-02 (App Flow): every published project, no limit, pagination, or filters.
export default async function WorkPage({ params }: PageProps<"/[lang]/work">) {
  const lang = await resolveLocale(params);
  const dict = getDictionary(lang);
  const projects = (await getPublishedProjects()).map((project) => toPublicProject(project, lang));

  return (
    <>
      <SiteHeader lang={lang} dict={dict} path="/work" />
      <main id="content" tabIndex={-1}>
        <Container className="pt-10 pb-16 lg:pt-18 lg:pb-24">
          <h1 className="text-display">{dict.workPage.title}</h1>
          <p className="mt-4 max-w-[58ch] text-text-muted lg:text-body-lg">{dict.workPage.intro}</p>

          <div className="mt-10 lg:mt-14">
            {projects.length > 0 ? (
              <>
                <ProjectGrid projects={projects} dict={dict} priorityFirst />
                <div className="mt-12 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border pt-8">
                  <p className="font-display text-card font-semibold">{dict.workPage.cta}</p>
                  <Button href={mailtoHref(dict.email.subject)}>{dict.cta.button}</Button>
                </div>
              </>
            ) : (
              <EmptyState dict={dict} />
            )}
          </div>
        </Container>
      </main>
    </>
  );
}

import type { Metadata } from "next";
import { AboutChapter } from "@/components/site/AboutChapter";
import { ContactChapter } from "@/components/site/ContactChapter";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/site/Hero";
import { HighlightChapter } from "@/components/site/HighlightChapter";
import { JsonLd } from "@/components/site/JsonLd";
import { ProjectGrid } from "@/components/site/ProjectGrid";
import { SelectedWork } from "@/components/site/SelectedWork";
import { SiteBar } from "@/components/site/SiteBar";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { Button } from "@/components/ui/Button";
import { getDictionary, interpolate, localePath } from "@/i18n";
import { resolveLocale } from "@/i18n/server";
import { getSiteSettings } from "@/lib/images/store";
import {
  HOMEPAGE_GRID_LIMIT,
  selectHomepageProjects,
  toPublicProject,
} from "@/lib/projects/public";
import { getPublishedProjects } from "@/lib/projects/queries";
import { homeJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata, siteOrigin } from "@/lib/seo/metadata";

// Safety net; admin saves also revalidate on demand (T-15). SDD section 5.
export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const lang = await resolveLocale(params);
  const dict = getDictionary(lang);
  return buildMetadata({ lang, path: "/", page: dict.seo.home, dict });
}

// Delta APP_FLOW S-01: Hero → Selected work → About → Highlight → Contact → footer.
// Selected work is still the v1 grid until T-30.
export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const lang = await resolveLocale(params);
  const dict = getDictionary(lang);

  const [projects, { avatar, availabilityOn }] = await Promise.all([
    getPublishedProjects(),
    getSiteSettings(),
  ]);
  const { grid, total } = selectHomepageProjects(
    projects.map((project) => toPublicProject(project, lang)),
  );

  const viewAllLabel =
    total > HOMEPAGE_GRID_LIMIT
      ? interpolate(dict.work.viewAllCount, { n: total })
      : dict.work.viewAll;

  return (
    <>
      <JsonLd data={homeJsonLd(lang, siteOrigin())} />
      <SiteBar lang={lang} dict={dict} path="/" />
      <main id="content" tabIndex={-1}>
        <Hero dict={dict} avatar={avatar} availabilityOn={availabilityOn} />
        <SelectedWork dict={dict}>
          {grid.length > 0 ? (
            <>
              <ProjectGrid projects={grid} dict={dict} />
              <Button href={localePath("/work", lang)} variant="ghost" className="mt-8">
                {viewAllLabel}
                <ArrowIcon direction="right" />
              </Button>
            </>
          ) : undefined}
        </SelectedWork>
        <AboutChapter dict={dict} />
        <HighlightChapter dict={dict} />
        <ContactChapter dict={dict} />
      </main>
      <Footer lang={lang} dict={dict} back="top" />
    </>
  );
}

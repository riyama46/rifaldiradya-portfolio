import type { Metadata } from "next";
import { About } from "@/components/site/About";
import { Hero } from "@/components/site/Hero";
import { HeroProofPanel, type ProofSlide } from "@/components/site/HeroProofPanel";
import { JsonLd } from "@/components/site/JsonLd";
import { ProjectGrid } from "@/components/site/ProjectGrid";
import { SelectedWork } from "@/components/site/SelectedWork";
import { Services } from "@/components/site/Services";
import { Footer } from "@/components/site/Footer";
import { SiteBar } from "@/components/site/SiteBar";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { Button } from "@/components/ui/Button";
import { getDictionary, interpolate, localePath } from "@/i18n";
import { resolveLocale } from "@/i18n/server";
import {
  HOMEPAGE_GRID_LIMIT,
  screenshotOf,
  selectHomepageProjects,
  toPublicProject,
} from "@/lib/projects/public";
import { getSiteSettings } from "@/lib/images/store";
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

// S-01 (App Flow): Hero → 01 Services → 02 Selected work → 03 About; the 04 CTA is in the footer.
export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const lang = await resolveLocale(params);
  const dict = getDictionary(lang);

  const [projects, { avatar }] = await Promise.all([getPublishedProjects(), getSiteSettings()]);
  const published = projects.map((project) => toPublicProject(project, lang));
  const { heroPanel, grid, total } = selectHomepageProjects(published);

  // heroPanel only holds projects with a live URL (selectHomepageProjects).
  const slides: ProofSlide[] = heroPanel.map((project) => ({
    id: project.id,
    slug: project.slug,
    title: project.title,
    liveUrl: project.liveUrl!,
    liveHost: new URL(project.liveUrl!).host,
    thumbnail: screenshotOf(project),
    ariaLabel: interpolate(dict.hero.proofAria, { title: project.title }),
  }));

  const viewAllLabel =
    total > HOMEPAGE_GRID_LIMIT
      ? interpolate(dict.work.viewAllCount, { n: total })
      : dict.work.viewAll;

  return (
    <>
      <JsonLd data={homeJsonLd(lang, siteOrigin())} />
      <SiteBar lang={lang} dict={dict} path="/" />
      <main id="content" tabIndex={-1} className="pt-16">
        <Hero
          dict={dict}
          avatar={avatar}
          proofPanel={
            slides.length > 0 ? (
              <HeroProofPanel
                slides={slides}
                labels={{
                  proofLabel: dict.hero.proofLabel,
                  visitShort: dict.card.visitShort,
                  live: dict.card.live,
                  pause: dict.slider.pause,
                  play: dict.slider.play,
                }}
              />
            ) : undefined
          }
        />
        <Services dict={dict} />
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
        <About dict={dict} />
      </main>
      <Footer lang={lang} dict={dict} back="top" />
    </>
  );
}

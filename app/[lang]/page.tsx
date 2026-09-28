import { About } from "@/components/site/About";
import { Hero } from "@/components/site/Hero";
import { HeroProofPanel, type ProofSlide } from "@/components/site/HeroProofPanel";
import { ProjectGrid } from "@/components/site/ProjectGrid";
import { SelectedWork } from "@/components/site/SelectedWork";
import { Services } from "@/components/site/Services";
import { SiteHeader } from "@/components/site/SiteHeader";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { Button } from "@/components/ui/Button";
import { getDictionary, interpolate, localePath } from "@/i18n";
import { resolveLocale } from "@/i18n/server";
import {
  HOMEPAGE_GRID_LIMIT,
  selectHomepageProjects,
  toPublicProject,
} from "@/lib/projects/public";
import { getPublishedProjects } from "@/lib/projects/queries";

// Safety net; admin saves also revalidate on demand (T-15). SDD section 5.
export const revalidate = 300;

// S-01 (App Flow): Hero → 01 Services → 02 Selected work → 03 About; the 04 CTA is in the footer.
export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const lang = await resolveLocale(params);
  const dict = getDictionary(lang);

  const published = (await getPublishedProjects()).map((project) => toPublicProject(project, lang));
  const { heroPanel, grid, total } = selectHomepageProjects(published);

  const slides: ProofSlide[] = heroPanel.map((project) => ({
    id: project.id,
    title: project.title,
    liveUrl: project.liveUrl,
    liveHost: project.liveHost,
    thumbnail: project.thumbnail,
    ariaLabel: interpolate(dict.hero.proofAria, { title: project.title }),
  }));

  const viewAllLabel =
    total > HOMEPAGE_GRID_LIMIT
      ? interpolate(dict.work.viewAllCount, { n: total })
      : dict.work.viewAll;

  return (
    <>
      <SiteHeader lang={lang} dict={dict} path="/" />
      <main id="content" tabIndex={-1}>
        <Hero
          dict={dict}
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
    </>
  );
}

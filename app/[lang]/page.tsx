import type { Metadata } from "next";
import { AboutChapter } from "@/components/site/AboutChapter";
import { ContactChapter } from "@/components/site/ContactChapter";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/site/Hero";
import { HighlightChapter } from "@/components/site/HighlightChapter";
import { JsonLd } from "@/components/site/JsonLd";
import { SelectedWork } from "@/components/site/SelectedWork";
import { SiteBar } from "@/components/site/SiteBar";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/server";
import { getSiteSettings } from "@/lib/images/store";
import { selectSelectedWork, toPublicProject } from "@/lib/projects/public";
import { getPublishedProjects } from "@/lib/projects/queries";
import { homeJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata, siteOrigin } from "@/lib/seo/metadata";

// Safety net; admin saves also revalidate on demand (T-15), but the CDN keeps its copy, so keep
// this short (D-39). SDD section 5.
export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const lang = await resolveLocale(params);
  const dict = getDictionary(lang);
  return buildMetadata({ lang, path: "/", page: dict.seo.home, dict });
}

// Delta APP_FLOW S-01: Hero → Selected work → About → Highlight → Contact → footer.
// E-25: without show_on_home projects the Selected work chapter is not rendered and the hero
// "Scroll ↓" points at About instead.
export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const lang = await resolveLocale(params);
  const dict = getDictionary(lang);

  const [projects, { avatar, availabilityOn }] = await Promise.all([
    getPublishedProjects(),
    getSiteSettings(),
  ]);
  const selected = selectSelectedWork(projects.map((project) => toPublicProject(project, lang)));

  return (
    <>
      <JsonLd data={homeJsonLd(lang, siteOrigin())} />
      <SiteBar lang={lang} dict={dict} path="/" />
      <main id="content" tabIndex={-1}>
        <Hero
          dict={dict}
          avatar={avatar}
          availabilityOn={availabilityOn}
          scrollTarget={selected.length > 0 ? "#work" : "#about"}
        />
        {selected.length > 0 && <SelectedWork lang={lang} dict={dict} projects={selected} />}
        <AboutChapter dict={dict} />
        <HighlightChapter dict={dict} />
        <ContactChapter dict={dict} />
      </main>
      <Footer lang={lang} dict={dict} back="top" />
    </>
  );
}

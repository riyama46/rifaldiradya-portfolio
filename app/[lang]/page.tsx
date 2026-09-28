import { About } from "@/components/site/About";
import { Hero } from "@/components/site/Hero";
import { SelectedWork } from "@/components/site/SelectedWork";
import { Services } from "@/components/site/Services";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/server";

// S-01 (App Flow): Hero → 01 Services → 02 Selected work → 03 About; the 04 CTA is in the footer.
// T-09 adds project data (hero proof panel + Selected work grid).
export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const lang = await resolveLocale(params);
  const dict = getDictionary(lang);

  return (
    <>
      <SiteHeader lang={lang} dict={dict} path="/" />
      <main id="content" tabIndex={-1}>
        <Hero dict={dict} />
        <Services dict={dict} />
        <SelectedWork dict={dict} />
        <About dict={dict} />
      </main>
    </>
  );
}

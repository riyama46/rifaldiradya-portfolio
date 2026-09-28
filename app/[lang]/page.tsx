import { SiteHeader } from "@/components/site/SiteHeader";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { getDictionary, localePath } from "@/i18n";
import { richText } from "@/i18n/rich";
import { resolveLocale } from "@/i18n/server";

// Temporary S-01 body for routing and shell checks; T-08 builds the real homepage sections.
export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const lang = await resolveLocale(params);
  const dict = getDictionary(lang);

  return (
    <>
      <SiteHeader lang={lang} dict={dict} path="/" />
      <main id="content" tabIndex={-1}>
        <Container className="py-16">
          <h1 className="hl-on-load max-w-[14ch] text-display">{richText(dict.hero.title)}</h1>
          <p className="mt-6 max-w-[58ch] text-text-muted">{dict.hero.subtitle}</p>
          <Button href={localePath("/work", lang)} className="mt-8">
            {dict.nav.work}
          </Button>
        </Container>
      </main>
    </>
  );
}

import { SiteHeader } from "@/components/site/SiteHeader";
import { Container } from "@/components/ui/Container";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/server";

// Temporary S-02 body; T-10 builds the project grid.
export default async function WorkPage({ params }: PageProps<"/[lang]/work">) {
  const lang = await resolveLocale(params);
  const dict = getDictionary(lang);

  return (
    <>
      <SiteHeader lang={lang} dict={dict} path="/work" />
      <main id="content" tabIndex={-1}>
        <Container className="py-16">
          <h1 className="text-display">{dict.workPage.title}</h1>
          <p className="mt-4 max-w-[58ch] text-text-muted">{dict.workPage.intro}</p>
        </Container>
      </main>
    </>
  );
}

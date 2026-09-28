import { SiteHeader } from "@/components/site/SiteHeader";
import { Container } from "@/components/ui/Container";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/server";

// Temporary S-03 body; T-10 adds the privacy copy.
export default async function PrivacyPage({ params }: PageProps<"/[lang]/privacy">) {
  const lang = await resolveLocale(params);
  const dict = getDictionary(lang);

  return (
    <>
      <SiteHeader lang={lang} dict={dict} path="/privacy" />
      <main id="content" tabIndex={-1}>
        <Container className="py-16">
          <h1 className="text-display">{dict.footer.privacy}</h1>
        </Container>
      </main>
    </>
  );
}

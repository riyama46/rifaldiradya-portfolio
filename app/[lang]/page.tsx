import { Button } from "@/components/ui/Button";
import { getDictionary, localePath } from "@/i18n";
import { richText } from "@/i18n/rich";
import { resolveLocale } from "@/i18n/server";

// Temporary S-01 shell for routing checks; T-08 builds the real homepage.
export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const lang = await resolveLocale(params);
  const dict = getDictionary(lang);

  return (
    <main id="content" className="mx-auto max-w-[1200px] px-4 py-16 lg:px-8">
      <h1 className="hl-on-load max-w-[14ch] text-display">{richText(dict.hero.title)}</h1>
      <p className="mt-6 max-w-[58ch] text-text-muted">{dict.hero.subtitle}</p>
      <Button href={localePath("/work", lang)} className="mt-8">
        {dict.nav.work}
      </Button>
    </main>
  );
}

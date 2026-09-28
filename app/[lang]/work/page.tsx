import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/server";

// Temporary S-02 shell; T-10 builds the project grid.
export default async function WorkPage({ params }: PageProps<"/[lang]/work">) {
  const lang = await resolveLocale(params);
  const dict = getDictionary(lang);

  return (
    <main id="content" className="mx-auto max-w-[1200px] px-4 py-16 lg:px-8">
      <h1 className="text-display">{dict.workPage.title}</h1>
      <p className="mt-4 max-w-[58ch] text-text-muted">{dict.workPage.intro}</p>
    </main>
  );
}

import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/server";

// Temporary S-03 shell; T-10 adds the privacy copy.
export default async function PrivacyPage({ params }: PageProps<"/[lang]/privacy">) {
  const lang = await resolveLocale(params);
  const dict = getDictionary(lang);

  return (
    <main id="content" className="mx-auto max-w-[1200px] px-4 py-16 lg:px-8">
      <h1 className="text-display">{dict.footer.privacy}</h1>
    </main>
  );
}

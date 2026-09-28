import type { Metadata } from "next";
import { headers } from "next/headers";
import { Button } from "@/components/ui/Button";
import { defaultLocale, getDictionary, isLocale, localePath } from "@/i18n";
import { fontVariables } from "@/lib/fonts";
import { LOCALE_HEADER } from "@/lib/locale-header";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "404 · Rifaldi Radya Pratama",
  robots: { index: false, follow: false },
};

// S-04 (App Flow): 404 for any unknown path, in the locale of the URL prefix (set by proxy.ts).
// Navbar and footer are added here once they exist (T-07).
export default async function GlobalNotFound() {
  const value = (await headers()).get(LOCALE_HEADER) ?? undefined;
  const lang = isLocale(value) ? value : defaultLocale;
  const dict = getDictionary(lang);

  return (
    <html lang={lang} className={fontVariables}>
      <body>
        <main id="content" className="mx-auto max-w-[1200px] px-4 py-24 lg:px-8">
          <h1 className="text-heading">{dict.notFound.title}</h1>
          <p className="mt-4 max-w-[58ch] text-text-muted">{dict.notFound.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href={localePath("/", lang)}>{dict.notFound.home}</Button>
            <Button href={localePath("/work", lang)} variant="secondary">
              {dict.notFound.work}
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}

import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./index";

/** Resolves the `[lang]` route param; anything other than en/id is a 404. */
export async function resolveLocale(params: Promise<{ lang: string }>): Promise<Locale> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return lang;
}

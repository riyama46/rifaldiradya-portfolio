import { localePath, type Locale } from "@/i18n";
import { cn } from "@/lib/cn";

type LanguageToggleProps = {
  lang: Locale;
  /** Locale-free path of the current page (`/`, `/work`, …); null for pages without a counterpart. */
  path: string | null;
  label: string;
};

const LOCALE_LABELS: Record<Locale, string> = { en: "EN", id: "ID" };

// O-01: real <a href> links (work without JS, crawlable). T-11 adds the lang_pref cookie,
// carrying the #hash, and the language_switch event on top of these links.
export function LanguageToggle({ lang, path, label }: LanguageToggleProps) {
  const target: Locale = lang === "en" ? "id" : "en";
  // Pages without a counterpart (404) switch to the other locale's home (App Flow O-01).
  const targetHref = localePath(path ?? "/", target);

  return (
    <div role="group" aria-label={label} className="flex items-center text-small font-medium">
      {(["en", "id"] as const).map((locale, index) => {
        const isActive = locale === lang;
        return (
          <span key={locale} className="flex items-center">
            {index > 0 && <span aria-hidden="true" className="h-3.5 w-px bg-border" />}
            <a
              href={isActive ? undefined : targetHref}
              lang={locale}
              hrefLang={locale}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "inline-flex min-h-11 min-w-9 items-center justify-center rounded-sm",
                isActive ? "text-accent" : "text-text-muted hover:text-text",
              )}
            >
              {LOCALE_LABELS[locale]}
            </a>
          </span>
        );
      })}
    </div>
  );
}

import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Container } from "@/components/ui/Container";
import { getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/server";
import { siteConfig } from "@/lib/site-config";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-card">{title}</h2>
      <div className="mt-3 text-text-muted">{children}</div>
    </section>
  );
}

// S-03 (App Flow): static privacy and cookie notice. The "Cookie settings" button (O-03) is added
// with the consent banner in T-19.
export default async function PrivacyPage({ params }: PageProps<"/[lang]/privacy">) {
  const lang = await resolveLocale(params);
  const dict = getDictionary(lang);
  const privacy = dict.privacy;
  const [contactBefore, contactAfter] = privacy.contactBody.split("{email}");

  return (
    <>
      <SiteHeader lang={lang} dict={dict} path="/privacy" />
      <main id="content" tabIndex={-1}>
        <Container className="pt-10 pb-16 lg:pt-18 lg:pb-24">
          <article className="max-w-[65ch]">
            <h1 className="text-display">{privacy.title}</h1>
            <p className="mt-3 text-small text-text-muted">{privacy.updated}</p>
            <p className="mt-6 text-lead font-display font-semibold text-pretty">{privacy.intro}</p>

            <Section title={privacy.collectTitle}>
              <p>{privacy.collectBody}</p>
            </Section>

            <Section title={privacy.cookiesTitle}>
              <table className="w-full table-fixed border-collapse text-left text-small">
                <thead>
                  <tr className="border-b border-border text-text">
                    <th scope="col" className="w-[28%] py-2 pr-3 font-medium">
                      {privacy.cookieName}
                    </th>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      {privacy.cookiePurpose}
                    </th>
                    <th scope="col" className="w-[26%] py-2 font-medium">
                      {privacy.cookieDuration}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {privacy.cookies.map((cookie) => (
                    <tr key={cookie.name} className="border-b border-border align-top">
                      <td className="py-3 pr-3 font-medium break-words text-text">{cookie.name}</td>
                      <td className="py-3 pr-3">{cookie.purpose}</td>
                      <td className="py-3">{cookie.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section title={privacy.changeTitle}>
              <p>{privacy.changeBody}</p>
            </Section>

            <Section title={privacy.emailTitle}>
              <p>{privacy.emailBody}</p>
            </Section>

            <Section title={privacy.contactTitle}>
              <p>
                {contactBefore}
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="font-medium text-text underline decoration-border decoration-2 underline-offset-4 hover:decoration-accent"
                >
                  {siteConfig.email}
                </a>
                {contactAfter}
              </p>
            </Section>
          </article>
        </Container>
      </main>
    </>
  );
}

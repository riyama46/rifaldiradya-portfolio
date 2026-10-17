import { AboutFacts } from "@/components/site/AboutFacts";
import { SectionHeader } from "@/components/site/SectionHeader";
import { Container } from "@/components/ui/Container";
import type { Dictionary } from "@/i18n";
import { richText } from "@/i18n/rich";

// App Flow S-01 section 4: 1:2 grid from 1024px; key sentences use <strong> from the dictionary.
export function About({ dict }: { dict: Dictionary }) {
  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="scroll-mt-14 bg-surface py-16 lg:py-24"
    >
      <Container className="grid gap-6 lg:grid-cols-[1fr_2fr] lg:gap-12">
        <SectionHeader
          number="03"
          label={dict.label.about}
          title={dict.about.title}
          titleId="about-title"
        />
        <div className="reveal flex max-w-[62ch] flex-col gap-5 lg:pt-4">
          <p className="text-lead font-semibold text-pretty">{richText(dict.about.lead)}</p>
          <p className="text-text-muted">{richText(dict.about.body)}</p>
          <AboutFacts dict={dict} />
        </div>
      </Container>
    </section>
  );
}

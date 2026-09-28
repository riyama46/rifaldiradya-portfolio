import { ProcessSteps } from "@/components/site/ProcessSteps";
import { SectionHeader } from "@/components/site/SectionHeader";
import { ServiceTile } from "@/components/site/ServiceTile";
import { Container } from "@/components/ui/Container";
import type { Dictionary } from "@/i18n";

// App Flow S-01 section 2: two tiles side by side at 3:2 from 768px, stacked on mobile.
export function Services({ dict }: { dict: Dictionary }) {
  return (
    <section
      id="services"
      aria-labelledby="services-title"
      className="scroll-mt-14 bg-surface py-16 lg:py-24"
    >
      <Container>
        <SectionHeader
          number="01"
          label={dict.label.services}
          title={dict.services.title}
          titleId="services-title"
          className="mb-8"
        />
        <div className="grid gap-4 md:grid-cols-[3fr_2fr] md:gap-6">
          <ServiceTile
            variant="primary"
            badge={dict.services.primary.badge}
            title={dict.services.primary.title}
            description={dict.services.primary.desc}
            className="reveal"
          >
            <ProcessSteps dict={dict} />
          </ServiceTile>
          <ServiceTile
            variant="secondary"
            badge={dict.services.secondary.badge}
            title={dict.services.secondary.title}
            description={dict.services.secondary.desc}
            className="reveal reveal-late"
          />
        </div>
      </Container>
    </section>
  );
}

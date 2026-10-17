import type { ReactNode } from "react";
import { EmptyState } from "@/components/site/EmptyState";
import { Container } from "@/components/ui/Container";
import type { Dictionary } from "@/i18n";

type SelectedWorkProps = {
  dict: Dictionary;
  /** Project grid + "View all work" (T-09). Without projects this shows the E-01 empty state. */
  children?: ReactNode;
};

// v1 project grid with the v2 chapter label, until T-30 pins Selected work. `#work` is the
// target of the hero "Scroll ↓" link.
export function SelectedWork({ dict, children }: SelectedWorkProps) {
  return (
    <section id="work" aria-labelledby="work-title" className="scroll-mt-14 py-16 lg:py-24">
      <Container>
        <h2 id="work-title" className="ch-label mb-8">
          {dict.work.h}
        </h2>
        {children ?? <EmptyState dict={dict} location="contact" />}
      </Container>
    </section>
  );
}

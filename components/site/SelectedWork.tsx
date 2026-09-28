import type { ReactNode } from "react";
import { EmptyState } from "@/components/site/EmptyState";
import { SectionHeader } from "@/components/site/SectionHeader";
import { Container } from "@/components/ui/Container";
import type { Dictionary } from "@/i18n";

type SelectedWorkProps = {
  dict: Dictionary;
  /** Project grid + "View all work" (T-09). Without projects this shows the E-01 empty state. */
  children?: ReactNode;
};

// App Flow S-01 section 3. `#work` is the target of the hero "See the Work" button.
export function SelectedWork({ dict, children }: SelectedWorkProps) {
  return (
    <section id="work" aria-labelledby="work-title" className="scroll-mt-14 py-16 lg:py-24">
      <Container>
        <SectionHeader
          number="02"
          label={dict.label.work}
          title={dict.work.featuredTitle}
          titleId="work-title"
          className="mb-8"
        />
        {children ?? <EmptyState dict={dict} />}
      </Container>
    </section>
  );
}

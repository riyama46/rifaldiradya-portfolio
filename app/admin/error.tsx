"use client";

import { adminStrings } from "@/components/admin/strings";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

// No raw errors or stack traces on screen (App Flow section 10), e.g. when MySQL is unreachable
// during the session check or the project query. The real error stays in the server log.
export default function AdminError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main>
      <Container className="py-10">
        <div
          role="alert"
          className="rounded-card border border-l-4 border-border border-l-danger bg-surface-raised p-6"
        >
          <p>{adminStrings.loadError}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => retry()}>
            {adminStrings.retry}
          </Button>
        </div>
      </Container>
    </main>
  );
}

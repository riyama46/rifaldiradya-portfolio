import { serializeJsonLd } from "@/lib/seo/jsonld";

// Rendered by Server Components so the data is in the initial HTML (SDD section 7). The only
// dangerouslySetInnerHTML allowed in the project: built from an object and escaped.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

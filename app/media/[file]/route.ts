import { parseMediaFile } from "@/lib/images/rules";
import { getVariant } from "@/lib/images/store";

const CONTENT_TYPES = { webp: "image/webp", jpeg: "image/jpeg" } as const;

// Serves stored thumbnails: /media/<id>.<ext> (largest) or /media/<id>-<width>.<ext>.
// Images never change after upload (a new thumbnail gets a new id), so the response can be cached
// for a year by browsers and the Hostinger CDN, and MySQL is only read on a cache miss.
export async function GET(_request: Request, ctx: RouteContext<"/media/[file]">) {
  const media = parseMediaFile((await ctx.params).file);
  const notFound = () =>
    new Response("Not found", { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
  if (!media) return notFound();

  let variant: Awaited<ReturnType<typeof getVariant>>;
  try {
    variant = await getVariant(media.id, media.width);
  } catch (error) {
    console.error("[media] read failed:", (error as Error).message);
    return new Response("Unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  if (!variant || variant.format !== media.format) return notFound();

  return new Response(new Uint8Array(variant.bytes), {
    headers: {
      "Content-Type": CONTENT_TYPES[variant.format],
      "Content-Length": String(variant.bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

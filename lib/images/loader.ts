// next/image custom loader. Thumbnails are stored in MySQL at fixed widths (lib/images/rules.ts)
// and served from /media; the loader only picks the stored width for the size the browser needs,
// so the server never resizes anything (no `sharp`, no Next.js image optimizer).
import { IMAGE_WIDTHS } from "./rules";

type LoaderArgs = { src: string; width: number; quality?: number };

const MEDIA_SRC = /^\/media\/([0-9A-Z]{26})\.(webp|jpg)$/;

export function mediaLoader({ src, width }: LoaderArgs): string {
  const match = MEDIA_SRC.exec(src);
  if (!match) return src;
  const step = IMAGE_WIDTHS.find((candidate) => candidate >= width) ?? IMAGE_WIDTHS.at(-1)!;
  return `/media/${match[1]}-${step}.${match[2]}`;
}

export default mediaLoader;

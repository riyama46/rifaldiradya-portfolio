// next/image custom loader (SDD section 3): Cloudinary transforms on the CDN, so the server needs no
// `sharp` and Next.js' own optimizer never touches these images.
// src is the stored Cloudinary secure_url; the transformation is inserted after "/image/upload/".

export const IMAGE_WIDTHS = [640, 960, 1280, 1600] as const;

type LoaderArgs = { src: string; width: number; quality?: number };

export function cloudinaryUrl({ src, width, quality }: LoaderArgs): string {
  const marker = "/image/upload/";
  const index = src.indexOf(marker);
  if (!src.startsWith("https://res.cloudinary.com/") || index === -1) return src;

  const step = IMAGE_WIDTHS.find((candidate) => candidate >= width) ?? IMAGE_WIDTHS.at(-1)!;
  const transform = `f_auto,q_${quality ?? "auto"},w_${step},c_limit`;
  const start = index + marker.length;
  return `${src.slice(0, start)}${transform}/${src.slice(start)}`;
}

export default function cloudinaryLoader(args: LoaderArgs): string {
  return cloudinaryUrl(args);
}

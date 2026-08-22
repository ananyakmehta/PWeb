import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

// DD_initial_build.md §3.5: block images go through astro:assets for optimization,
// lazy loading, and format conversion. The content-collection schema stores `src` as a
// plain relative-path string (not Zod's `image()` helper), so this module resolves
// that string to an actual imported asset — via a static glob keyed by block slug —
// and pre-optimizes it at build time with getImage(). The resolved plain object
// (already-optimized URL + dimensions) is what gets passed into the Svelte feed
// island, since astro:assets' <Image /> component itself is Astro-only and can't run
// inside a client-rendered Svelte tree.
const modules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/blocks/**/*.{png,jpg,jpeg,svg,webp}',
  { eager: true }
);

export interface ResolvedBlockImage {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
}

export interface RawBlockImage {
  src: string;
  alt: string;
  caption?: string;
}

export async function resolveBlockImages(
  slug: string,
  images: RawBlockImage[] | undefined
): Promise<ResolvedBlockImage[]> {
  if (!images || images.length === 0) return [];

  const resolved: ResolvedBlockImage[] = [];
  for (const img of images) {
    const filename = img.src.split('/').pop();
    const key = `/src/assets/blocks/${slug}/${filename}`;
    const mod = modules[key];
    if (!mod) {
      throw new Error(`resolveBlockImages: no asset found at "${key}" (block "${slug}")`);
    }
    const optimized = await getImage({ src: mod.default, width: 800 });
    resolved.push({
      src: optimized.src,
      width: Number(optimized.attributes.width),
      height: Number(optimized.attributes.height),
      alt: img.alt,
      caption: img.caption,
    });
  }
  return resolved;
}

import type { ImageMetadata } from 'astro';

// DD_v2.md §1.5: `astro:assets` / `<Image />` for all images, from the start. Unlike
// v1 (which had to pre-resolve images to plain optimized URLs, because the renderer
// was a client-rendered Svelte island and <Image /> is Astro-only), v2's cards and
// detail pages are plain Astro components — so this just needs to turn the
// content-collection's relative-path string into the actual imported asset module,
// and callers pass that straight into <Image src={...} />, letting Astro's own image
// pipeline handle optimization.
const modules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/blocks/**/*.{png,jpg,jpeg,svg,webp}',
  { eager: true }
);

export function getBlockAsset(slug: string, relSrc: string): ImageMetadata {
  const filename = relSrc.split('/').pop();
  const key = `/src/assets/blocks/${slug}/${filename}`;
  const mod = modules[key];
  if (!mod) {
    throw new Error(`getBlockAsset: no asset found at "${key}" (block "${slug}")`);
  }
  return mod.default;
}

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// NOTE ON DEVIATION FROM DD_v2.md §3.1 (carried over from v1): the doc's snippet uses
// `src/content/config.ts` + `defineCollection({ type: 'content', schema })`, the legacy
// content-collections API. The installed Astro version (7.2.4) has fully removed that
// legacy path/format in favor of the Content Layer API — building against the doc's
// exact snippet fails with a hard [LegacyContentConfigError]. This is a
// toolchain-version incompatibility, not a style choice: the file lives at the new
// required location (`src/content.config.ts`) with an explicit `glob()` loader
// pointing at the same `src/content/blocks/` directory. The Zod schema itself is
// otherwise unchanged from what the doc specifies.

const typeTagEnum = z.enum([
  'research',
  'project',
  'publication',
  'internship',
  'experience',
]);

const topicTagEnum = z.enum([
  'ml',
  'fluids-aero',
  'biomechanics',
  'mechanical-design',
  'signal-processing',
]);

const linkSchema = z.object({
  label: z.string(),
  url: z.string(),
});

const imageSchema = z.object({
  src: z.string(), // relative path, resolved via astro:assets
  alt: z.string(),
  caption: z.string().optional(),
});

const versionSchema = z.object({
  // for CAD-car-style "previous versions" — flexible list, N entries
  label: z.string(), // e.g. "v2"
  date: z.string().optional(),
  specs: z.string().optional(),
  cadUrl: z.string().optional(),
});

const subItemSchema = z.object({
  // for "one block, spawned sub-project" cases (e.g. NCAN + autoclassification site — future pass)
  title: z.string(),
  description: z.string(),
  links: z.array(linkSchema).optional(),
});

const blockSchema = z.object({
  title: z.string(),
  slug: z.string(), // becomes the /projects/<slug> URL
  status: z.enum(['ongoing', 'paused', 'completed']),
  priority: z.number(), // manual sort order for the index view
  dateStart: z.string(),
  dateEnd: z.string().optional(), // absent = ongoing
  typeTags: z.array(typeTagEnum),
  topicTags: z.array(topicTagEnum),
  // Inert metadata in v2 — no filtering UI consumes these anymore (DD_v2 §2.3), but
  // they still render as small non-interactive labels on the detail page (§6.3).
  cardSummary: z.string(), // one short line for the sparse index card (DD_v2 §3.1, §4.2)
  // DD_initial_build.md §3.2 (unchanged reasoning in v2): lives in frontmatter, not the
  // markdown body, so the block object is fully described by validated frontmatter
  // alone. Full detail-page description only — never shown on the index card.
  primaryDescription: z.string(),
  award: z.string().optional(),
  links: z.array(linkSchema).optional(),
  subItems: z.array(subItemSchema).optional(),
  images: z.array(imageSchema).max(3).optional(), // supplementary, detail page only; up to 3, must gracefully handle 1, 2, or 3
  heroImage: imageSchema, // required — dominant visual on the index card and top of the detail page (DD_v2 §3.1)
  tools: z.array(z.string()).optional(), // flat list, e.g. ["OnShape", "SolidWorks", "Python"]
  versions: z.array(versionSchema).optional(), // CAD-car-style version history
  currentWork: z.string().optional(), // GT-style "what I'm doing now" blurb
  impact: z.string().optional(), // torque-ML-style "impact" blurb
  isOther: z.boolean().default(false), // true = renders in the "Other" section instead of the main index grid
  // NOTE: v1's `theme` field (per-block color theme key) is removed — DD_v2 §5.3
  // replaces per-block theming with one site-wide palette, so there's no longer a
  // per-block theme to key into.
});

const blocks = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blocks' }),
  schema: blockSchema,
});

export const collections = { blocks };

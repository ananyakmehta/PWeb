import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// NOTE ON DEVIATION FROM DD_initial_build.md §3.1: the doc specifies this file as
// `src/content/config.ts` using `defineCollection({ type: 'content', schema })` (the
// legacy content-collections API). The Astro version actually installed here (7.2.4)
// has fully removed that legacy path/format in favor of the Content Layer API —
// building against the doc's exact snippet fails with a hard
// [LegacyContentConfigError], not a lint warning. This is a toolchain-version
// incompatibility, not a style choice: the file has been moved to the new required
// location (`src/content.config.ts`) and given an explicit `glob()` loader pointing at
// the same `src/content/blocks/` directory. The Zod schema itself — the actual design
// decision in §3.1 — is unchanged field-for-field from the doc.

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
  slug: z.string(),
  status: z.enum(['ongoing', 'paused', 'completed']),
  priority: z.number(), // manual sort order for the unfiltered default view
  dateStart: z.string(),
  dateEnd: z.string().optional(), // absent = ongoing
  typeTags: z.array(typeTagEnum),
  topicTags: z.array(topicTagEnum),
  // DD_initial_build.md §3.2: primaryDescription lives in frontmatter (not the markdown
  // body). Chosen over using the body-as-description because it keeps the block object
  // fully described by validated frontmatter alone — rendering never needs to call
  // entry.render()/<Content /> just to get the primary text, which simplifies passing
  // block data as plain serializable props into the Svelte feed island (§5/§6).
  primaryDescription: z.string(), // markdown-capable body content
  award: z.string().optional(),
  links: z.array(linkSchema).optional(),
  subItems: z.array(subItemSchema).optional(),
  images: z.array(imageSchema).max(3).optional(), // up to 3; component must gracefully handle 1, 2, or 3
  tools: z.array(z.string()).optional(), // flat list, e.g. ["OnShape", "SolidWorks", "Python"]
  versions: z.array(versionSchema).optional(), // CAD-car-style version history
  currentWork: z.string().optional(), // GT-style "what I'm doing now" blurb
  impact: z.string().optional(), // torque-ML-style "impact" blurb
  isOther: z.boolean().default(false), // true = renders in "Other" section, not main feed, and is excluded from tag filtering
  theme: z.string(), // key into the per-block theme config, see src/config/blockThemes.ts
});

const blocks = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blocks' }),
  schema: blockSchema,
});

export const collections = { blocks };

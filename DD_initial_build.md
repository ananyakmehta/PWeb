# PWeb — Personal Portfolio Site: Design Doc v1 (Layout Pilot)

## Purpose of this document

This is a build spec for Claude Code. This first pass builds **layout and interaction infrastructure only** — four pilot content blocks, all with placeholder/filler text and placeholder images, so the owner can review structure and feel before any real content is written. Do not invent real project content, real descriptions, or real specs beyond what's marked as filler below — use clearly-labeled Lorem-ipsum-style placeholder text so it's obviously not final copy.

Project root: **`PWeb/`**. Everything for this project lives inside this single folder.

---

## 1. Stack & Deployment

### 1.1 Framework
- **Astro**, with **Svelte** for interactive islands (the filter bar + block feed, and per-block canvas/SVG easter-egg components).
- Static output (`astro build` → `dist/`), deployed as a static site. No server-side runtime.

### 1.2 Hosting
- **GitHub Pages**, deployed via **GitHub Actions** (build step required — Astro is not raw HTML, so Pages cannot serve the repo directly without a build).
- Custom domain: not configured in this pass. Structure the build so adding a `CNAME` file later is trivial, but do not set one up now.

### 1.3 Repository & auth setup
1. Human installs GitHub CLI (`gh`) and runs `gh auth login` (HTTPS, browser-based OAuth) once, on their own machine. This is a one-time human step — Claude Code cannot do this part.
2. **Repo creation is delegated to Claude Code**, using a name and visibility the human specifies explicitly in their prompt (e.g., "create a public repo named `X`"). Claude Code should run `gh repo create <name> --public --source=. --remote=origin` (or equivalent) using exactly the name/visibility given — it should not invent or alter the requested name, and should confirm the created repo's URL back to the human after creation.
3. From that point, Claude Code may run `git init` (if needed), `git add`, `git commit`, `git push`, and manage branches directly — it inherits the human's authenticated `gh`/git session.
4. **Still excluded**: Claude Code should not attempt the Pages-settings toggle (Settings → Pages → set source to "GitHub Actions") or any other account-level settings change without flagging it to the human first — this is a one-time manual click in the GitHub UI, confirmed as the standard required step for Actions-based Pages deployment, and is cheap for the human to do once rather than debug if an automated attempt silently doesn't take.

### 1.4 Build & deploy workflow
- Add `.github/workflows/deploy.yml`:
  - Trigger: push to `main`.
  - **Required permissions block** (common source of silent deploy failures if omitted): `contents: read`, `pages: write`, `id-token: write`.
  - Steps: checkout → setup Node → `npm install` → `npm run build` → upload `dist/` as Pages artifact → deploy via `actions/deploy-pages`.
  - Use Astro's official GitHub Pages Actions template as the baseline (standard, documented pattern — do not hand-roll a nonstandard workflow). Note: older tutorials showing a git-push-to-`gh-pages`-branch approach are deprecated; use the native Actions-based Pages deployment (`actions/deploy-pages`), not the legacy branch-push method.
- Astro config (`astro.config.mjs`): set `site` and `base` appropriately for a `username.github.io/reponame` deployment (base path matters — do not omit it, or asset paths will 404 on Pages).
- **Repo-side one-time setup** (human, in the GitHub UI, after the repo exists): Settings → Pages → under "Build and deployment," set Source to "GitHub Actions." This is required once per repo before the workflow's deploy step will succeed.

### 1.5 Package/tooling notes
- Node package manager: npm (default; no strong preference stated, npm is the safe default).
- Svelte integration via `@astrojs/svelte`.
- Image handling: use Astro's built-in `<Image />` / `astro:assets` from the start (see §3.5) — do not use plain `<img>` tags, so optimization is free and doesn't need retrofitting later.

---

## 2. Information Architecture

### 2.1 Page structure (single page, anchor-free — one continuous scroll)
1. **Hero section** (top) — see §4.
2. **Filter bar** (sticky or near-top, below hero) — multiselect tag pills, two groups (Type, Topic). See §5.
3. **Main feed** — filtered/sortable block list. See §6.
4. **Divider: "Other"** — appears only when no filter is active and the user scrolls past all tagged content. See §7.
5. **Other section** — untagged blocks (taekwondo, tutoring in future passes; none built in this pilot pass, but the divider and section container should exist and be empty/ready).

### 2.2 Not in scope for this pass
- Real content for any block beyond the 4 pilot blocks.
- Taekwondo / tutoring blocks (structure only — build the "Other" section container and divider component, leave content empty or with a single filler block if useful for visual QA).
- Robotics block (not ready — team CAD not sourceable yet; do not build a placeholder for it).
- Custom domain / DNS.
- Résumé/contact links functioning with real URLs (use `#` placeholders, clearly marked).

---

## 3. Data Model (Astro Content Collection)

### 3.1 Schema (Zod, in `src/content/config.ts`)

```ts
import { defineCollection, z } from 'astro:content';

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
  theme: z.string(), // key into the per-block theme config, see §8
});

const blocks = defineCollection({
  type: 'content',
  schema: blockSchema,
});

export const collections = { blocks };
```

**Design notes for Claude Code:**
- `status` has three values but this pass only uses `ongoing` and `completed` in actual pilot content — `paused` must still be a fully supported value in the status-dot component (see §6.3), not just in the schema, since it will be used in a future pass and should not require touching the component again.
- One shared schema, one shared block-rendering component, for both main-feed and Other-section blocks (per the "same shape, different placement logic" decision — do not build two parallel systems). `isOther` and the presence/absence of tags is what routes a block to its section, not a separate content type or component.
- `versions` is intentionally an array even though only filler content exists now — do not build this as a single optional object.

### 3.2 Content files
- One `.md` file per block in `src/content/blocks/`, frontmatter matching the schema above, body (if any) unused/ignored in favor of `primaryDescription` field for consistency — OR use the markdown body itself as `primaryDescription` (Claude Code's choice, pick whichever is cleaner in Astro's content collection API; document the choice in code comments).
- Placeholder images go in `src/assets/blocks/<slug>/` and are referenced by relative path in each block's `images` field.

### 3.3 Sort logic
- Default (no filter active): sort by `priority` ascending (lower number = higher up). Manually assigned per block, not derived.
- Filtered view: same relative order among the blocks that remain (filtering does not re-sort, it only removes non-matching blocks from the rendered list).

### 3.4 Filtering logic (see §5 for UI)
- Two independent tag groups: `typeTags`, `topicTags`.
- Within a group: **OR** — a block matches the group if it has *any* of the currently-selected tags in that group.
- Across groups: **AND** — a block must satisfy both groups' conditions (if a group has no active selections, that group's condition is trivially satisfied/ignored).
- Formally: `(activeTypeTags.length === 0 || block.typeTags.some(t => activeTypeTags.includes(t))) && (activeTopicTags.length === 0 || block.topicTags.some(t => activeTopicTags.includes(t)))`
- Blocks with `isOther: true` are never included in main-feed filtering or the main feed itself, regardless of tags.

### 3.5 Images
- Use `astro:assets`'s `<Image />` component for all block images — automatic optimization, lazy loading, format conversion.
- Image grid must gracefully reflow for 1, 2, or 3 images per block (not a rigid 3-slot layout that breaks with fewer). Use CSS grid with `auto-fit` or explicit conditional layouts for 1/2/3 counts.
- This pass: use clearly-placeholder images (solid color blocks with labels, or a placeholder image service/local generated placeholder) — do not attempt to source or generate real project photography.

---

## 4. Hero Section

- Casual tone, not LinkedIn-header style.
- Layout: photo (placeholder for now) + short 3-line description (**filler text for this pass** — human will write real copy later) + link row (GitHub, LinkedIn, résumé, email — all `#` placeholders) + the filter pill bar (see §5) directly below.
- Fun graphics: small, restrained decorative elements (e.g., small paper-airplane motifs) — "nothing super busy." Treat as a light accent, not a focal element; this is explicitly a place to exercise restraint per the one-signature-element principle — the site's real signature moments are the per-block easter eggs, not the hero.
- Hero sits on top of the constellation background (§8.1), which should already be visible/establishing tone here before any block content starts.

---

## 5. Filter Bar (Svelte island)

### 5.1 Structure
- Two visually grouped rows/clusters of pills: **Type** (research, project, publication, internship, experience) and **Topic** (ml, fluids-aero, biomechanics, mechanical-design, signal-processing).
- Multiselect within and across both groups.
- Selected pills get a visually distinct "active" state (contrasted fill).

### 5.2 Tag descriptions (hover/tap reveal)
- Each pill has an associated 1–2 sentence description (filler text this pass).
- On hover (desktop) or tap (mobile fallback — tapping shows the description without immediately toggling the filter on a *second* tap, OR toggles filter on first tap and shows description simultaneously — Claude Code should pick the simpler, more standard mobile pattern: tap = toggle filter AND show description together, since a separate "reveal-only" tap state adds friction with little payoff) the description fades in below/beside the pill in a lighter secondary text color, clearly de-emphasized relative to the pill itself.
- Description must not cause layout shift for *other* pills when revealed — reserve space or use an overlay/absolute-positioned reveal, not an in-flow element that pushes siblings around.

### 5.3 Per-block tag highlighting (the "matched tag" contrast rule)
- When a filter is active, each visible block's own tag pills (rendered on the block itself, not just in the filter bar) should render tags that match the active filter with a **darker/more contrasted pill background** than the block's non-matching tags. This lets someone see at a glance which tag(s) caused a given block to appear in a filtered view.
- When no filter is active, all tags on all blocks render in their default (non-contrasted) state.

### 5.4 Reflow animation
- Use Svelte's built-in `animate:flip` directive on the block list's `{#each}` block, keyed by `slug`.
- Blocks leaving the filtered set: fade + shrink out.
- Remaining blocks: animate smoothly into their new position (FLIP).
- This is the single most important interaction in the site per the brief — get this right before polishing anything else in the feed.

---

## 6. Block Component (shared, used by all blocks in both Main Feed and Other)

### 6.1 Shared skeleton (applies to every block type)
1. Title (block name)
2. Subheading: date range (`dateStart` – `dateEnd`, or `dateStart` – "Ongoing" if `dateEnd` absent)
3. Status dot + label (see §6.3)
4. Tag pills (type + topic tags, rendered together; matched/unmatched contrast per §5.3)
5. Primary description (2–4 lines depending on block, filler text this pass)
6. Images (1–3, reflowing grid, placeholders this pass)
7. **Block-specific middle content** — varies per block type, see §6.4–6.7 for the 4 pilot blocks specifically
8. Tools row: small, clearly labeled (e.g., "Tools:"), flat dot-separated list, **not styled in the prominent accent color** — deliberately de-emphasized relative to the rest of the block, per the correction in this doc's design discussion (a skills list restates what the block's real content already implies; keep it small and reference-only, not a styled focal element)

### 6.2 One component, data-driven variation
- Build **one** Svelte or Astro block component that renders the shared skeleton and conditionally renders the block-specific middle section based on which optional fields are present (`versions` → renders version history list; `currentWork` → renders current-work blurb; `impact` + `links` → renders impact + repo/docs links; etc.). Do not build 4 separate one-off components for the 4 pilot blocks — the schema is designed so one component handles all of them via conditional rendering.

### 6.3 Status dot
- Dot + label beside it, small and unobtrusive.
- Color mapping:
  - `ongoing` → blue
  - `completed` → green
  - `paused` → amber/yellow (not used in this pass's content, but must be a fully working state in the component)

### 6.4 CAD Car block — middle content
- After images: specs + version number of current car, link labeled "CAD" to current CAD file (placeholder URL).
- Below that, in a lighter grey tone: previous versions list (array, `versions` field), each with its own specs + CAD link. Filler content — generate 2–3 filler "previous version" entries so the list layout can be reviewed with more than one item.

### 6.5 GT Research block — middle content
- After images: 2–3 line "what I'm doing now" blurb (`currentWork` field, filler text).

### 6.6 Torque ML Project block — middle content
- After images: 2–3 sentence impact blurb (`impact` field, filler text), then links to repo and project docs (`links`, placeholder URLs).

### 6.7 Mount Sinai block — middle content
- Description is 3–4 lines (not 2–3, per spec — this block's description is intentionally longer than the others).
- After images: link to repo, and a link styled as "Published in NHSJS" (hyperlinked text, placeholder URL).
- Includes the marble/orb reveal easter egg (§9.4) — this happens in the *background/embedded within* this block's layout, with the marbles falling into a trough that lines the bottom of the block, revealing text behind each landing slot.

---

## 7. "Other" Section

- Appears at the very bottom of the page, **only in the unfiltered/no-selection view** — if any filter tag is active, the Other section and its divider do not render (per spec: "no other tags will show this — just other").
- A visually distinct divider component reading "Other" (or similar) precedes it.
- This pass: build the divider component and an empty/ready section container. Do not populate with taekwondo/tutoring content yet (future pass) — optionally include one clearly-marked filler block if useful for visual QA of the divider + section spacing, but this is optional, not required.
- Uses the same shared block component as the main feed (per §6.2) — no separate component needed.

---

## 8. Visual Theme System

### 8.1 Base layer (constant across the whole page)
- **Real constellations** (actual star position data for recognizable constellations — e.g., Orion, Cassiopeia, Big Dipper — not generative/random scatter), rendered as a dimmed, low-opacity background layer, present continuously from the hero all the way down the page, behind every block.
- Colors/densities vary across constellations for visual interest, per the original brief ("different colors, different densities").
- This is the connective tissue of the whole site — individual block themes (below) sit **on top of** this layer via their own card/section treatments; they do not replace or hide it. Each block's themed background effect should be scoped to that block's section only (e.g., via a contained canvas or SVG within that block's DOM boundary) and should coexist with the dimmed starfield still being visible around/behind it, not fully obscure it.

### 8.2 Default cursor: "Ship of the Imagination"
- A small ship-silhouette cursor replacement/trail, referencing the general concept of Carl Sagan's *Cosmos* vessel (a simple, original silhouette design — not a reproduction of any specific copyrighted artwork or footage) — this is the default cursor treatment everywhere on the page **except** where a block explicitly overrides it (CAD car block: dust trail; S2G block: footprints — future pass; Mount Sinai: no cursor override specified).
- Build this as a lightweight, reusable cursor-trail component that can be swapped per-block-section (mount/unmount based on scroll position or hover boundary of a themed section).

### 8.3 Per-block theme tokens (this pass's 4 blocks)

| Block | Background | Accent/text | Block-specific background effect | Cursor override |
|---|---|---|---|---|
| CAD Car | `rgb(92, 12, 12)` (maroon, exact, locked) | White + light pink text | Halftone dot field, dots ripple outward from cursor position and settle back (not a persistent repel/displacement) | Pink dust trail, fades out |
| GT Research | Dark navy | Light blue accents/text | Literal single spinning spiral (vortex), lighter navy than background | None specified — default ship cursor |
| Torque ML | Forest green | (Standard light text on dark green — no further accent spec given; use a sensible light neutral or soft green-tinted white) | None specified this pass | None — default ship cursor |
| Mount Sinai | Dark purple | (Light purple/lavender text — infer from purple family, consistent with other blocks' light-accent-on-dark pattern) | Ambient "synapses firing" — loose, non-literal sparks flashing in the dark (NOT a literal connected node/network diagram) — must read as subtle, explicitly not distracting | None specified — default ship cursor |

- Torque ML and Mount Sinai's exact accent hex values are not specified in the brief beyond "forest green" and "dark purple" — Claude Code should pick specific hex values consistent with the same lightness/contrast pattern as the two fully-specified blocks (dark saturated background, white/light-tinted accent text) and flag the chosen values clearly in code comments / a theme config file so they're easy to adjust in review.

### 8.4 Theme config
- Centralize all per-block theme tokens (background color, accent color, effect type, cursor override) in a single config file (e.g., `src/config/blockThemes.ts`) keyed by the block's `theme` field — do not hardcode colors inline in components. This makes future blocks' themes a config addition, not a new component.

---

## 9. Easter Eggs (this pass: 3, one per applicable pilot block)

### 9.1 General approach
- Each easter egg is scoped to its block's section (mounts/unmounts based on scroll visibility of that block).
- Reduced-motion preference (`prefers-reduced-motion`) must be respected — provide a static/no-animation fallback for all three.

### 9.2 CAD Car — F1 acceleration scroll animation
- Triggered on scroll-into-view of the CAD car block.
- A car silhouette/graphic animates across the block from right to left.
- Motion must use a **non-linear ease-out curve** (e.g., `cubic-bezier(0.16, 1, 0.3, 1)` or equivalent) — most horizontal distance covered in the first ~30–40% of the animation's duration, visibly continuing but slowing its rate of travel for the remainder. Do not use linear or ease-in-out.
- Accompanying text follows the car's motion with a slight lag (small delay or slightly slower easing than the car itself) so it reads as "following," not rigidly attached.
- Pink dust particle trail behind the car, fading out over ~1 second per particle (per §8.3).

### 9.3 S2G footprints — NOT in this pass
- Explicitly deferred (S2G is a future-pass block, not one of the 4 pilot blocks). Do not build in this pass. Noted here so the cursor-override architecture (§8.2) is built to accommodate it later without rework.

### 9.4 Mount Sinai — marble/orb trough reveal
- On scroll-into-view: small spheres, styled in the block's own purple-family palette (not glowing, not the specific look of any existing copyrighted character design — an original color/material treatment), fall and roll along a track, landing in a row of slots that line the bottom of the block ("trough").
- Each slot starts empty/dark; when a sphere lands in it, text content behind that slot is revealed (filler text this pass — in real content, this would be an actual stat or output snippet from the model, not decorative filler).
- **Replayable**: a small replay icon appears next to the settled trough after the animation completes, allowing the user to re-trigger the fall.
- This is a generic "objects fall and reveal content" interaction pattern (comparable to marble runs / slot-reveal UI patterns) — explicitly avoid replicating any specific existing media property's production design (shelving/archive environment, specific glow treatment, character-specific color mapping). Original palette and treatment only.
- Build as a Svelte component scoped to the Mount Sinai block, using canvas or SVG + CSS/JS animation (Claude Code's implementation choice).

---

## 10. Explicitly Out of Scope This Pass

- Real content/copy for any block (all text is filler/placeholder, clearly marked as such in code comments where helpful).
- Real images/photography.
- Taekwondo, tutoring, S2G, robotics, wind tunnel, or any block beyond the 4 specified (CAD Car, GT Research, Torque ML, Mount Sinai).
- Custom domain / DNS configuration.
- Résumé file, real social/contact links.
- Search functionality (not discussed/requested — do not add).
- Any GitHub repo creation or Pages-settings toggling — human handles repo creation; Claude Code handles code, commits, and the Actions workflow file only, and should flag (not silently attempt) any account-level settings change.

---

## 11. Review Checklist (for the human, once built)

- [ ] Site builds and deploys via the Actions workflow on push to `main`.
- [ ] Filter bar: multiselect works within and across Type/Topic groups per the AND/OR logic in §3.4.
- [ ] Tag hover-reveal descriptions show/hide without layout shift; mobile tap fallback works.
- [ ] Reflow animation (FLIP) is smooth when toggling filters.
- [ ] All 4 pilot blocks render the shared skeleton correctly, with their block-specific middle content.
- [ ] Status dots show correct colors for `ongoing` (blue) and `completed` (green); `paused` (amber) verified in isolation even though unused in content yet.
- [ ] Constellation background is visible and consistent behind all sections, including within themed blocks.
- [ ] Ship-of-the-imagination cursor active by default; correctly overridden inside the CAD Car block (dust trail) with no override elsewhere in this pass.
- [ ] CAD Car: halftone ripple-on-cursor background works; F1 scroll animation uses proper ease-out (not linear); text lag is visible but subtle.
- [ ] GT Research: spinning spiral background renders, doesn't feel distracting.
- [ ] Mount Sinai: marble/orb trough animation plays on scroll-in, replay icon works, ambient spark background is subtle not distracting.
- [ ] Images gracefully handle 1, 2, and 3-image blocks (test with varying placeholder counts).
- [ ] "Other" section divider + container exist, only render when no filter is active.
- [ ] Tools row is present but visually de-emphasized (not accent-colored/prominent) on all 4 blocks.
- [ ] Reduced-motion preference disables/simplifies all three animated effects appropriately.

# PWeb — Personal Portfolio Site: Design Doc v2.1 (Simplified Architecture + Visual Refinements)

## What changed in v2.1 (context for whoever reads this later)

Building on v2's architecture (sparse index cards + real detail pages, no filtering, no per-block theming, easter eggs deferred), this revision replaces the background treatment, restructures the hero layout, moves to a 2-column card grid, and sets the typeface. Read alongside v2 — this document supersedes v2's §4.1 (hero), §5 (visual identity), and §4.4 (layout) specifically; everything else in v2 still applies unchanged.

## What changed from v1 to v2, and why (retained for context)

v1 built a single continuous scroll page with full detail inline per block, multiselect tag filtering, per-block color themes, and three custom easter eggs. After reviewing a reference site (davisryan.tech — a Squarespace-built portfolio, not a code reference, but a strong layout/tone reference), the owner decided to simplify:

- **Filtering is dropped entirely.** Reasoning: the content set is small enough that project titles alone should be legible without needing to filter by category.
- **Per-block color theming is dropped.** One consistent visual identity (see §5) replaces per-block theme swaps.
- **Easter eggs are dropped from this pass**, to be revisited once real content and layout are in place and it's clearer which moments actually deserve a custom animation.
- **Architecture changes from "one long page, full detail inline" to "sparse index page + real separate detail pages per project"** — closer to how the reference site works, and a better fit for Astro's content-collection-to-page routing model. This also gets the owner shareable, linkable URLs per project, which the inline-block approach didn't support.

This is a full replacement of v1's plan, not a diff — treat this document as the complete, current spec.

Project root: **`PWeb/`**. Everything for this project lives inside this single folder.

---

## 1. Stack & Deployment (unchanged from v1)

### 1.1 Framework
- **Astro**, with **Svelte** available for any interactive components that still need it (scroll-reveal triggers, small hover effects) — but no large stateful Svelte island is required anymore now that filtering is gone. Use plain Astro templating wherever possible; only reach for a Svelte component where real client-side interactivity is needed.
- Static output (`astro build` → `dist/`), deployed as a static site. No server-side runtime.

### 1.2 Hosting
- **GitHub Pages**, deployed via **GitHub Actions**.
- Public repos incur no GitHub Actions minutes charge regardless of how many times this is iterated on — confirmed, not a constraint on this project.
- Custom domain: not configured in this pass.

### 1.3 Repository & auth setup
1. Human runs `gh auth login` once, locally. Claude Code cannot do this part.
2. **Repo creation delegated to Claude Code**, using a name and visibility the human specifies explicitly in their prompt. Claude Code runs `gh repo create <name> --public --source=. --remote=origin` (or equivalent) using exactly the given name — does not invent or alter it — and confirms the created repo's URL back to the human.
3. Claude Code manages `git init`/`add`/`commit`/`push`/branches directly from that point on.
4. **Still excluded**: the Pages-settings toggle (Settings → Pages → source = "GitHub Actions") and any other account-level GitHub settings change — flag to the human, don't attempt automatically.

### 1.4 Build & deploy workflow
- `.github/workflows/deploy.yml`:
  - Trigger: push to `main`.
  - Permissions block: `contents: read`, `pages: write`, `id-token: write`.
  - Steps: checkout → setup Node → `npm install` → `npm run build` → upload `dist/` as Pages artifact → deploy via `actions/deploy-pages`.
  - Use Astro's official GitHub Pages Actions template as the baseline. Use the native Actions-based deployment method, not the legacy `gh-pages`-branch git-push approach.
- `astro.config.mjs`: set `site` and `base` correctly for `username.github.io/reponame` deployment — required for asset paths to resolve on Pages.
- Repo-side one-time human step: Settings → Pages → Source → "GitHub Actions," after the repo exists.

### 1.5 Package/tooling notes
- npm as package manager.
- `@astrojs/svelte` integration, used sparingly (see §1.1).
- `astro:assets` / `<Image />` for all images from the start — not plain `<img>` tags.

---

## 2. Site Architecture

### 2.1 Pages
1. **Home / Index** (`/`) — hero section + sparse project card grid/list. See §3, §4.
2. **Project detail pages** (`/projects/<slug>`) — one per content-collection entry, auto-generated via Astro's `getStaticPaths`. Full detail per project lives here, not on the index. See §6.
3. **"Other" section** — this pass, treat as either a dedicated page (`/other`) or a section at the bottom of the index — **open decision, see §9**.

### 2.2 Shared layout
- A single shared Astro layout component wraps every page (index and all detail pages), so the site's consistent visual identity (§5) — background treatment, header/nav, cursor — persists across navigation rather than needing to be rebuilt per page.
- Simple top nav: Home, Projects (if useful as an anchor/index), Résumé, contact links — mirrors the reference site's minimal nav (Home / Resume / Projects).

### 2.3 What's explicitly removed vs. v1
- No filter bar, no tag multiselect, no FLIP reflow animation, no per-block matched-tag contrast styling.
- No per-block theme config (no per-project background color/accent/effect swapping).
- No easter eggs this pass (F1 acceleration animation, marble/orb reveal, footprints — all deferred, not deleted from the idea list, just out of scope now).

---

## 3. Data Model (Astro Content Collection)

### 3.1 Schema (Zod, `src/content/config.ts`)

Mostly unchanged from v1 — tags remain in the data (useful metadata, may power something later, e.g. a simple non-interactive label on a card) but no longer drive any filtering UI.

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
  src: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
});

const versionSchema = z.object({
  label: z.string(),
  date: z.string().optional(),
  specs: z.string().optional(),
  cadUrl: z.string().optional(),
});

const subItemSchema = z.object({
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
  dateEnd: z.string().optional(),
  typeTags: z.array(typeTagEnum),
  topicTags: z.array(topicTagEnum),
  cardSummary: z.string(), // NEW: 1 short line for the sparse index card
  primaryDescription: z.string(), // full description, used on the detail page only
  award: z.string().optional(),
  links: z.array(linkSchema).optional(),
  subItems: z.array(subItemSchema).optional(),
  images: z.array(imageSchema).max(3).optional(),
  heroImage: imageSchema, // NEW: required — the single large image shown on the index card and at the top of the detail page
  tools: z.array(z.string()).optional(),
  versions: z.array(versionSchema).optional(),
  currentWork: z.string().optional(),
  impact: z.string().optional(),
  isOther: z.boolean().default(false),
});

const blocks = defineCollection({
  type: 'content',
  schema: blockSchema,
});

export const collections = { blocks };
```

**Changes from v1 schema:**
- Added `cardSummary` — a single short line (not the full description) specifically for the sparse index card, separate from `primaryDescription` which is now detail-page-only content.
- Added `heroImage` — a required single large image, distinct from the `images` array. The index card and the top of the detail page both use this one image as the dominant visual, matching the reference site's "one big image per project" pattern. The `images` array (up to 3) becomes supplementary images shown further down the detail page, not the card.
- Removed: `theme` field (no per-block theming anymore).
- Kept as-is: tags (now inert metadata, not filter-driving), `versions`, `subItems`, `tools`, `status`, `priority`.

### 3.2 Content files
- One `.md` file per project in `src/content/blocks/`, frontmatter per the schema above.
- Placeholder images in `src/assets/blocks/<slug>/`.

### 3.3 Sort logic
- Index view: sort by `priority` ascending — same manual-priority approach as v1 (CAD car + GT research first as the current/ongoing work, then the rest).

### 3.4 Routing
- `src/pages/projects/[slug].astro` uses `getStaticPaths()` against the `blocks` collection to generate one static page per entry at build time. Standard Astro content-collection pattern — no custom routing logic needed.

---

## 4. Home / Index Page

### 4.1 Hero section — REVISED in v2.1: full split layout, not a header

- **Layout**: two-column split, roughly 50/50 width, spanning close to full viewport height (not a compact header bar).
  - **Left half**: a photo of the site owner — large, the dominant visual element of this half, not a small inset image.
  - **Right half**: casual, not-LinkedIn-header-style short 3-line description (filler text this pass), plus the link row (GitHub, LinkedIn, résumé, email — `#` placeholders this pass).
- **Responsive behavior**: must be explicitly designed, not assumed — a 50/50 side-by-side split does not work at mobile widths. Standard pattern: stack vertically at a defined breakpoint (image on top, text below, or vice versa — Claude Code's reasonable call, flag which was chosen). Do not ship this as desktop-only and let mobile break.
- Sits on the reactive halftone background (§5.1 — replaces the constellation from v2), establishing the site's visual identity immediately.
- No filter bar below it (still removed per v2 §2.3) — the hero transitions directly into the project grid.

### 4.2 Sparse project cards
Each card, in the index grid/list, shows only:
1. `heroImage` — large, dominant visual.
2. `title`.
3. `cardSummary` (one line).
4. Status dot + label (see §4.3) — small, unobtrusive.
5. A single "Learn More" / "View Project" link/button pointing to `/projects/<slug>`.

Explicitly **not** shown on the card: full description, tags, tools, links, versions, sub-items, images array — all of that lives on the detail page only. This is the core of the "sparse" instruction — the card's job is to make someone want to click, not to tell the whole story.

### 4.3 Status dot (unchanged from v1)
- `ongoing` → blue, `completed` → green, `paused` → amber (amber unused in this pass's actual content but must still be a fully working state in the component).

### 4.4 Layout — REVISED in v2.1: 2-column grid

- **2 cards per row at desktop widths**, smaller card size than v2's original stacked-large-card concept — the goal is more projects visible at once with less scrolling, not one dominant card per viewport.
- **Collapses to 1 column at mobile** widths (standard responsive grid pattern — not explicitly stated by the owner but obviously required; flag if a different breakpoint behavior is chosen).
- Generous spacing between cards still applies even at the smaller size — 2-column does not mean cramped.
- Scroll-triggered fade/slide-in as cards enter viewport (`IntersectionObserver`-based, standard pattern), same as v2 — unchanged by the column-count revision.

---

## 5. Visual Identity (site-wide, consistent — replaces v1's per-block theme system)

### 5.1 Background: reactive halftone — REPLACES v2's constellation starfield entirely

**This is a full replacement, not an addition.** The constellation starfield concept from v2 is dropped sitewide — the reactive halftone is now the site's one signature background element, persistent across hero, index cards, and detail pages via the shared layout component (§2.2 in v2).

- **Base mechanic**: carried forward from the original v1 CAD-car-block spec — a field of small dots that **ripple outward from the cursor position and settle back** (not a persistent repel/displacement effect — dots return to rest position after the ripple passes, they don't stay displaced while the cursor lingers nearby).
- **Color treatment (new in v2.1)**:
  - Base tone: navy (specific hex not given — pick a dark navy consistent with a "not blinding, not high-contrast" reading; document the chosen hex clearly in a theme config file for easy review/adjustment).
  - Dots: smaller than the original CAD-car-block version, colored only **very slightly lighter** than the navy background — low contrast by design, so the effect reads as subtle texture/motion rather than a bold graphic pattern.
  - This is explicitly a **quieter, more ambient** version of the original halftone concept, not a direct reuse of the CAD car block's higher-contrast pink-on-maroon treatment — the color relationship (near-background, low-contrast dots) is the important spec here, not just "navy instead of maroon."
- Performance note for Claude Code: a cursor-reactive canvas/SVG effect running behind an entire page (not scoped to one block anymore) needs to stay performant across the full scroll length, including sections with cards/images on top of it — test for jank on scroll, not just on a static viewport.

### 5.2 Cursor: "Ship of the Imagination"
- Unchanged from v2. Default cursor treatment sitewide, no per-block overrides in this pass (overrides deferred along with the easter eggs — see §8).
- Small original ship-silhouette design (general concept reference to Carl Sagan's *Cosmos* vessel, not a reproduction of any specific copyrighted artwork).

### 5.3 Typography (new in v2.1)
- **Display/heading face**: **Arvo** (Google Fonts, freely available and directly usable — not a fallback-only aspiration). Use for titles, headings, and nav — the characterful face, used with restraint per standard type-pairing practice, not applied to dense body text.
  - Fallback stack for resilience: another geometric slab serif (e.g., `'Arvo', 'Roboto Slab', 'Zilla Slab', serif`) in case of load failure — belt-and-suspenders, Arvo itself should load fine via standard Google Fonts embedding.
- **Body/paragraph face**: a plain, readable sans-serif (Claude Code's reasonable choice — e.g., system UI sans-serif stack, or a clean Google Sans-serif pairing) — explicitly **not** Arvo, for readability at body-text sizes. Document the chosen pairing clearly.

### 5.4 Color palette (still open, unchanged from v2)
- Beyond the halftone's own navy/dot treatment (§5.1), the rest of the site's palette (text colors, link colors, card backgrounds, accent color if any) is still not fully specified. Propose values consistent with the navy halftone base and flag for review — do not invent silently.

---

## 6. Project Detail Page (`/projects/<slug>`)

Full content, in order:
1. `heroImage`, large, at the top.
2. Title, date range, status dot + label.
3. Tags — can render here as small, non-interactive labels (informational only, no click/filter behavior).
4. `primaryDescription` — full description.
5. `images` array (up to 3, gracefully handles 1–3 — same reflow requirement as v1).
6. Block-specific middle content, same conditional-rendering approach as v1 (one shared detail-page template, renders sections based on which optional fields are present):
   - CAD Car: current specs/version + CAD link, then `versions` array in lighter grey.
   - GT Research: `currentWork` blurb.
   - Torque ML: `impact` blurb + repo/docs links.
   - Mount Sinai: repo link + "Published in NHSJS" link. (Longer `primaryDescription`, 3–4 lines vs. others' 2–3, per original spec — still applies here, just on the detail page now instead of an inline block.)
7. Tools row: small, de-emphasized styling (not accent-colored/prominent) — same correction as v1, still applies.
8. Back-to-index link/nav.

---

## 7. Pilot Content Scope (unchanged set, new architecture)

Same 4 pilot entries as v1 — CAD Car, GT Research, Torque ML Project, Mount Sinai — now each producing one index card + one detail page instead of one inline block. All content remains filler/placeholder text and placeholder images this pass; no real copy yet.

---

## 8. Deferred, Not Deleted

These were designed in v1 and are explicitly paused, not abandoned — worth revisiting once real content and the new layout are in place and it's clearer what actually deserves the extra build effort:
- Tag-based filtering (multiselect, FLIP reflow).
- Per-project color theming.
- Easter eggs: F1 ease-out scroll acceleration (CAD car), marble/orb trough reveal (Mount Sinai), footprints (S2G, future block), and the per-block cursor overrides that went with them.

---

## 9. Open Items for Next Pass

- **Site palette**: needs actual hex values decided (§5.4) — navy halftone base + dot color now partially specified in principle (§5.1), but exact hex, plus text/link/card colors, still open.
- **"Other" section placement**: dedicated page vs. bottom-of-index section — not decided yet (§2.1).
- **Project grid layout specifics**: exact grid vs. stacked-card arrangement, spacing, how many cards per row at desktop/mobile — not fully specified, Claude Code should propose a reasonable version consistent with the reference site's spacing and flag it for review rather than treat it as fully locked.
- **cardSummary vs. primaryDescription content**: since these are new distinct fields, filler placeholder text should make the distinction between them obviously visible (e.g., card summary noticeably shorter/punchier than the detail-page description) so the difference can be evaluated in review.

---

## 10. Explicitly Out of Scope This Pass

- Real content/copy, real images/photography.
- Taekwondo, tutoring, S2G, robotics, wind tunnel blocks.
- Custom domain / DNS.
- Résumé file, real social/contact links.
- Search functionality.
- Filtering, per-block theming, easter eggs (see §8 — deferred, not cancelled).
- Any GitHub repo creation beyond what's specified in §1.3, or Pages-settings toggling.

---

## 11. Review Checklist

- [ ] Site builds and deploys via Actions on push to `main`.
- [ ] Index page renders sparse cards only (heroImage, title, cardSummary, status dot, link) — no full description/tags/tools visible on cards.
- [ ] Cards render in a 2-column grid at desktop, collapsing to 1 column at mobile.
- [ ] Hero section is a true 50/50 split (image left, text/links right) at desktop, with a working, non-broken stacked layout at mobile.
- [ ] Clicking a card navigates to a real, distinct `/projects/<slug>` URL.
- [ ] Detail page renders full content per §6, with correct block-specific middle content per project.
- [ ] Shared layout (background, nav, cursor) persists correctly across navigation from index to detail pages and back.
- [ ] Status dots correct for `ongoing`/`completed`, and `paused` verified working in isolation.
- [ ] Reactive halftone background renders consistently across all pages — navy base, low-contrast smaller dots, ripple-and-settle on cursor movement, no jank on scroll.
- [ ] Ship-of-the-imagination cursor active sitewide, no per-block overrides present.
- [ ] Arvo renders correctly on headings/titles; body text uses the chosen sans-serif, not Arvo.
- [ ] Images gracefully handle 1–3 count in the `images` array on detail pages.
- [ ] Tools row present but visually de-emphasized.
- [ ] Scroll-reveal animation on index cards works and respects `prefers-reduced-motion`.

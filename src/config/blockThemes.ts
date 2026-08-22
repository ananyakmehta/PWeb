// Centralized per-block theme tokens — DD_initial_build.md §8.4: "do not hardcode
// colors inline in components. This makes future blocks' themes a config addition,
// not a new component." Keyed by each block's `theme` frontmatter field.

export type EffectKind = 'halftone' | 'spiral' | 'synapses' | 'none';
export type CursorOverrideKind = 'dust-trail' | 'none';

export interface BlockTheme {
  background: string;
  accent: string; // primary text/link color on this block's background
  textSecondary: string; // de-emphasized text tone (still on-brand, not pure grey)
  effect: EffectKind;
  cursorOverride: CursorOverrideKind;
}

export const blockThemes: Record<string, BlockTheme> = {
  'cad-car': {
    background: 'rgb(92, 12, 12)', // maroon — exact hex/rgb, LOCKED per DD §8.3 table
    accent: '#ffffff',
    textSecondary: '#f5c6d6', // light pink, per DD §8.3 ("White + light pink text")
    effect: 'halftone',
    cursorOverride: 'dust-trail',
  },
  'gt-research': {
    // DD §8.3 specifies "Dark navy" background / "Light blue accents/text" as a
    // description, not an exact hex — the doc's own flag-for-review call-out (end of
    // §8.3) only names Torque ML and Mount Sinai explicitly, but no hex was given here
    // either. Chosen to sit in the same dark-saturated-bg / light-tinted-text family as
    // the fully locked CAD Car block. Not expected to need adjustment, but flagging
    // for completeness alongside the two the doc calls out directly.
    background: '#0d1b3d',
    accent: '#bfe0ff',
    textSecondary: '#8fb8e0',
    effect: 'spiral',
    cursorOverride: 'none',
  },
  'torque-ml': {
    // FLAGGED PER DD §8.3: "Torque ML ... exact accent hex values are not specified in
    // the brief beyond 'forest green'." Chosen to match the dark-saturated-bg /
    // light-neutral-text pattern of the specified blocks, using the doc's own
    // suggested fallback ("soft green-tinted white"). Adjust freely in review.
    background: '#12362a',
    accent: '#eafbea',
    textSecondary: '#a9d8bd',
    effect: 'none',
    cursorOverride: 'none',
  },
  'mount-sinai': {
    // FLAGGED PER DD §8.3: exact hex not specified beyond "dark purple" background;
    // accent text color is explicitly left to inference ("infer from purple family").
    // Chosen to match the same dark-bg / light-accent pattern as the other blocks.
    // Adjust freely in review.
    background: '#2a1a40',
    accent: '#e3d3f7',
    textSecondary: '#b79bd6',
    effect: 'synapses',
    cursorOverride: 'none',
  },
  other: {
    // Neutral placeholder theme for the (currently empty) "Other" section container —
    // not specced in DD §8.3 since no Other-section blocks are built this pass.
    background: '#1c1c22',
    accent: '#e8e8ee',
    textSecondary: '#a0a0ac',
    effect: 'none',
    cursorOverride: 'none',
  },
};

export const defaultBlockTheme: BlockTheme = blockThemes.other;

export function getBlockTheme(themeKey: string): BlockTheme {
  return blockThemes[themeKey] ?? defaultBlockTheme;
}

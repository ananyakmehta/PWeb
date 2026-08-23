// Shared proximity-based hover reveal for every ".konami-hint" element currently in
// the DOM — used by the hero's own hints (Hero.astro) and the "every other" project
// card hints (ProjectCard.astro/index.astro) rather than duplicating the same ~15
// lines of hover-distance tracking per instance. One shared mousemove listener drives
// every instance's own opacity from its own bounding box, independently.
//
// This only ever sets 0 (cursor far away) to 1 (cursor right on it) — it has no
// opinion on whether a given hint is ALSO allowed to be visible right now for some
// other reason (e.g. the hero hints shouldn't show at all outside the scroll-pinned
// live mode, or before the swing/hero-copy they're nested in has itself faded in).
// That's handled by nesting: each hint lives inside whatever ancestor element already
// controls ITS OWN opacity for that other reason, and CSS opacity compounds through
// ancestors automatically — a child's rendered opacity is its own opacity times every
// ancestor's, not just its own. So a hint nested inside a still-invisible ancestor
// stays invisible regardless of what this sets, with no coordination needed here.
const RADIUS = 90; // px — how close the cursor needs to be for a hint to reach full opacity

export function initKonamiHints(): void {
  const hints = Array.from(document.querySelectorAll<HTMLElement>('.konami-hint'));
  if (hints.length === 0) return;

  let ticking = false;

  function apply(clientX: number, clientY: number) {
    for (const el of hints) {
      const rect = el.getBoundingClientRect();
      // Zero-size means display:none somewhere up the ancestor chain (e.g. a hero
      // hint while outside live mode) — nothing to measure proximity against, and
      // (0,0) would otherwise read as "the cursor is right on it" if it happened to
      // be near the viewport's own top-left corner.
      if (rect.width === 0 && rect.height === 0) continue;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(clientX - cx, clientY - cy);
      el.style.opacity = Math.max(0, 1 - dist / RADIUS).toFixed(2);
    }
  }

  function handleMove(e: MouseEvent) {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      apply(e.clientX, e.clientY);
      ticking = false;
    });
  }

  window.addEventListener('mousemove', handleMove, { passive: true });
}

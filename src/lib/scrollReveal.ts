// Shared by the index page's project cards and the detail page's alternating sections
// — same replayable slide-in mechanic (toggle on a 0.25 intersection threshold, not a
// one-shot reveal-then-unobserve) so both surfaces behave identically and stay in sync
// if the timing/threshold ever changes, rather than two copies drifting apart.
//
// 0.25, not the original 0.5 — per direct feedback, waiting until a card/section was
// half on-screen left a beat of visibly empty space above it (the reveal hadn't
// triggered yet even though the element's box was already partly in the viewport).
// Triggering at a quarter visible instead starts the slide-in while there's much less
// of that gap still to close.
export function initScrollReveal(root: ParentNode = document): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = root.querySelectorAll<HTMLElement>('[data-reveal]');

  if (reduced) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        entry.target.classList.toggle('is-visible', entry.intersectionRatio >= 0.25);
      }
    },
    { threshold: 0.25 }
  );
  targets.forEach((el) => io.observe(el));
}

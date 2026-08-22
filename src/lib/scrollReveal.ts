// Shared by the index page's project cards and the detail page's alternating sections
// — same replayable slide-in mechanic (toggle on a 0.5 intersection threshold, not a
// one-shot reveal-then-unobserve) so both surfaces behave identically and stay in sync
// if the timing/threshold ever changes, rather than two copies drifting apart.
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
        entry.target.classList.toggle('is-visible', entry.intersectionRatio >= 0.5);
      }
    },
    { threshold: 0.5 }
  );
  targets.forEach((el) => io.observe(el));
}

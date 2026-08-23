<script>
  // Direct instruction: a small persistent toggle in the very top-right corner of
  // the viewport, labeled "static mode", on by default, that turns off the
  // reactive halftone background's rainbow grid when switched off — see
  // src/lib/staticMode.ts for the shared localStorage + live-broadcast plumbing
  // with ReactiveHalftoneBackground.svelte. Deliberately its own fixed-position
  // element rather than folded into Nav.astro's icon row: the nav's own content is
  // capped to a centered max-width column, so its icons aren't actually in the
  // viewport's own corner on a wide screen — this needs to be, regardless of nav
  // width. Initial render defaults to "on" (matches the default in staticMode.ts)
  // since localStorage isn't available at build/SSR time; onMount immediately
  // corrects it to whatever was actually last chosen.
  import { onMount } from 'svelte';
  import { getRainbowEnabled, setRainbowEnabled } from '../lib/staticMode';

  let enabled = $state(true);

  onMount(() => {
    enabled = getRainbowEnabled();
  });

  function toggle() {
    enabled = !enabled;
    setRainbowEnabled(enabled);
  }
</script>

<div class="static-mode-toggle">
  <span class="label" id="staticModeLabel">static mode</span>
  <button
    type="button"
    class="switch"
    role="switch"
    aria-checked={enabled}
    aria-labelledby="staticModeLabel"
    onclick={toggle}
  >
    <span class="thumb" class:on={enabled}></span>
  </button>
</div>

<style>
  .static-mode-toggle {
    /* Fixed to the viewport, not the page — stays put in the corner regardless of
       scroll position, above the nav (z-index) since the nav is only sticky, not
       fixed, and would otherwise scroll this out of view along with it if this
       were nested inside it. top is below Nav.astro's own icon row (confirmed via
       screenshot: that row sits at ~28.5-46.5px from the top across the entire
       desktop width range, not just at the site's own centered max-width — Nav
       only stops being full-width, and its icons only drift further from the true
       viewport corner, above ~1264px) rather than sharing that row — the two were
       genuinely overlapping (the switch landing right on top of the GitHub icon)
       at ordinary laptop widths like 1280px before this was caught. */
    position: fixed;
    top: 3.75rem;
    right: 1.5rem;
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .label {
    font-size: 0.65rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--page-text-dim);
    user-select: none;
  }

  .switch {
    position: relative;
    width: 30px;
    height: 17px;
    padding: 0;
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    cursor: pointer;
    transition: background 150ms ease, border-color 150ms ease;
  }

  .switch[aria-checked='true'] {
    background: var(--accent);
    border-color: var(--accent);
  }

  .thumb {
    position: absolute;
    top: 1px;
    left: 1px;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: var(--page-text);
    transition: transform 150ms ease;
  }

  .thumb.on {
    transform: translateX(13px);
  }

  @media (max-width: 640px) {
    .static-mode-toggle {
      top: 0.75rem;
      right: 0.75rem;
    }

    .label {
      display: none;
    }
  }
</style>

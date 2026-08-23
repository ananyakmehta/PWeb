<script>
  // Direct instruction: a small persistent toggle in the very bottom-right corner
  // of the viewport, labeled "static mode", off by default, whose own on/off state
  // IS static mode directly — on disables the reactive halftone background's
  // rainbow grid, off (the default) leaves it running normally — see
  // src/lib/staticMode.ts for the shared localStorage + live-broadcast plumbing
  // with ReactiveHalftoneBackground.svelte. Deliberately its own fixed-position
  // element rather than folded into Nav.astro's icon row: the nav's own content is
  // capped to a centered max-width column, so its icons aren't actually in the
  // viewport's own corner on a wide screen — this needs to be, regardless of nav
  // width. Initial render defaults to "off" (matches the default in
  // staticMode.ts) since localStorage isn't available at build/SSR time; onMount
  // immediately corrects it to whatever was actually last chosen.
  import { onMount } from 'svelte';
  import { getStaticModeEnabled, setStaticModeEnabled } from '../lib/staticMode';

  let enabled = $state(false);

  onMount(() => {
    enabled = getStaticModeEnabled();
  });

  function toggle() {
    enabled = !enabled;
    setStaticModeEnabled(enabled);
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
       scroll position. Bottom-right per direct instruction; z-index keeps it above
       ordinary page content (the halftone canvas is z-index:0, page content is
       z-index:1) without needing to dodge anything the way the top corner did
       with Nav.astro's own icon row. */
    position: fixed;
    bottom: 1.5rem;
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
      bottom: 0.75rem;
      right: 0.75rem;
    }

    .label {
      display: none;
    }
  }
</style>

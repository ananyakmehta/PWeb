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
  //
  // The whole control (label text + switch pill) is ONE <button>, not a small
  // switch with an inert label next to it — per direct feedback, only the tiny
  // pill itself used to be clickable, which read as an annoyingly small target.
  // Padding on the button (compensated by pulling bottom/right in by the same
  // amount) grows the actual hit area further still without moving the visible
  // switch's own on-screen position.
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

<button
  type="button"
  class="static-mode-toggle"
  role="switch"
  aria-checked={enabled}
  aria-label="Static mode"
  onclick={toggle}
>
  <span class="label">static mode</span>
  <span class="switch-track" class:on={enabled}>
    <span class="thumb" class:on={enabled}></span>
  </span>
</button>

<style>
  .static-mode-toggle {
    /* Fixed to the viewport, not the page — stays put in the corner regardless of
       scroll position. Bottom-right per direct instruction; z-index keeps it above
       ordinary page content (the halftone canvas is z-index:0, page content is
       z-index:1) without needing to dodge anything the way the top corner did
       with Nav.astro's own icon row. padding+the smaller bottom/right offset
       together enlarge the clickable box while keeping the visible switch pill at
       the exact same on-screen spot as a bare 1.5rem/1.5rem inset with no padding
       would have put it. */
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    margin: 0;
    border: none;
    border-radius: 999px;
    background: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 150ms ease;
  }

  .static-mode-toggle:hover,
  .static-mode-toggle:focus-visible {
    background: rgba(255, 255, 255, 0.06);
  }

  .label {
    font-size: 0.65rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--page-text-dim);
    user-select: none;
  }

  .switch-track {
    position: relative;
    width: 30px;
    height: 17px;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    transition: background 150ms ease, border-color 150ms ease;
  }

  .switch-track.on {
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
      bottom: 0.25rem;
      right: 0.25rem;
    }

    .label {
      display: none;
    }
  }
</style>

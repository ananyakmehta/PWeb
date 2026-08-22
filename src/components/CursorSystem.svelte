<script>
  // DD_v2.md §5.2 — "Ship of the Imagination" cursor, default sitewide, no per-block
  // overrides this pass (the override mechanism and dust-trail variant existed in v1
  // but are deferred along with the rest of the easter eggs — DD_v2 §8).
  import { onMount } from 'svelte';

  let visible = $state(false);
  let x = $state(0);
  let y = $state(0);
  let reducedMotion = $state(false);

  function handleMove(e) {
    x = e.clientX;
    y = e.clientY;
    if (!visible) visible = true;
  }

  function handleLeave() {
    visible = false;
  }

  onMount(() => {
    const fine = window.matchMedia('(pointer: fine)');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion = motion.matches;
    const updateMotion = () => (reducedMotion = motion.matches);
    motion.addEventListener('change', updateMotion);

    if (!fine.matches) {
      // Touch/coarse-pointer device: no cursor to replace, leave native cursor alone.
      return () => motion.removeEventListener('change', updateMotion);
    }

    document.documentElement.classList.add('custom-cursor-active');
    window.addEventListener('mousemove', handleMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleLeave);

    return () => {
      document.documentElement.classList.remove('custom-cursor-active');
      window.removeEventListener('mousemove', handleMove);
      document.documentElement.removeEventListener('mouseleave', handleLeave);
      motion.removeEventListener('change', updateMotion);
    };
  });
</script>

{#if visible}
  <div
    class="cursor-root"
    class:instant={reducedMotion}
    style={`transform: translate(${x}px, ${y}px);`}
    aria-hidden="true"
  >
    <svg class="ship" width="30" height="30" viewBox="0 0 30 30">
      <path
        d="M2 15 L24 8 L18 15 L24 22 Z"
        fill="#dfe7ff"
        stroke="#7f9cff"
        stroke-width="0.75"
        stroke-linejoin="round"
      />
      <circle cx="10" cy="15" r="1.4" fill="#7f9cff" />
    </svg>
  </div>
{/if}

<style>
  :global(html.custom-cursor-active),
  :global(html.custom-cursor-active *) {
    cursor: none !important;
  }

  .cursor-root {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;
    pointer-events: none;
    transition: transform 140ms ease-out;
    will-change: transform;
  }

  .cursor-root.instant {
    transition: none;
  }

  .ship {
    display: block;
    filter: drop-shadow(0 0 3px rgba(127, 156, 255, 0.6));
  }
</style>

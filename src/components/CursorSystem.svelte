<script>
  // DD_initial_build.md §8.2 — default "Ship of the Imagination" cursor everywhere,
  // swapped per-block-section via override. This pass only defines one override
  // (CAD Car: pink dust trail, §8.3); the data-cursor-override attribute mechanism is
  // built generically so future overrides (e.g. S2G footprints, §9.3) are a new case
  // in `mode`, not a rework of this component.
  import { onMount } from 'svelte';

  let visible = $state(false);
  let x = $state(0);
  let y = $state(0);
  let mode = $state('ship'); // 'ship' | 'dust-trail'
  let reducedMotion = $state(false);
  let particles = $state([]);

  let particleId = 0;
  let lastParticleAt = 0;

  function handleMove(e) {
    x = e.clientX;
    y = e.clientY;
    if (!visible) visible = true;

    const overrideEl = e.target instanceof Element ? e.target.closest('[data-cursor-override]') : null;
    mode = overrideEl ? overrideEl.getAttribute('data-cursor-override') : 'ship';

    if (mode === 'dust-trail' && !reducedMotion) {
      const now = performance.now();
      if (now - lastParticleAt > 40) {
        lastParticleAt = now;
        const id = particleId++;
        particles = [...particles, { id, x, y }];
        setTimeout(() => {
          particles = particles.filter((p) => p.id !== id);
        }, 1000);
      }
    }
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
    {#if mode === 'ship'}
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
    {/if}
  </div>

  {#if mode === 'dust-trail'}
    {#each particles as p (p.id)}
      <div class="dust-particle" style={`left:${p.x}px; top:${p.y}px;`}></div>
    {/each}
  {/if}
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

  .dust-particle {
    position: fixed;
    top: 0;
    left: 0;
    width: 5px;
    height: 5px;
    margin: -2.5px 0 0 -2.5px;
    border-radius: 50%;
    background: #f2a6c4;
    pointer-events: none;
    z-index: 9998;
    animation: dust-fade 1s ease-out forwards;
  }

  @keyframes dust-fade {
    0% {
      opacity: 0.85;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(0.3) translateY(6px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .dust-particle {
      animation: none;
      opacity: 0;
    }
  }
</style>

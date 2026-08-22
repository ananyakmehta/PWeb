<script>
  // DD_initial_build.md §8.3 (GT Research block-specific background effect): "Literal
  // single spinning spiral (vortex), lighter navy than background." A single
  // Archimedean spiral path, continuously rotated via CSS.
  import { onMount } from 'svelte';

  let reducedMotion = $state(false);

  onMount(() => {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  function buildSpiralPath(turns, points, maxRadius) {
    let d = '';
    for (let i = 0; i <= points; i++) {
      const t = i / points;
      const angle = t * turns * Math.PI * 2;
      const radius = t * maxRadius;
      const x = 50 + radius * Math.cos(angle);
      const y = 50 + radius * Math.sin(angle);
      d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2) + ' ';
    }
    return d;
  }

  const spiralPath = buildSpiralPath(5, 240, 46);
</script>

<div class="spiral-layer" aria-hidden="true">
  <svg class="spiral" class:spinning={!reducedMotion} viewBox="0 0 100 100">
    <path d={spiralPath} fill="none" stroke="#2f4a7a" stroke-width="1" />
  </svg>
</div>

<style>
  .spiral-layer {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .spiral {
    width: 130%;
    height: 130%;
    opacity: 0.55;
  }

  .spiral.spinning {
    animation: spin 24s linear infinite;
    transform-origin: 50% 50%;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>

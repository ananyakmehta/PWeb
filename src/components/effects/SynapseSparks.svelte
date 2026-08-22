<script>
  // DD_initial_build.md §8.3 (Mount Sinai block-specific background effect): "Ambient
  // 'synapses firing' — loose, non-literal sparks flashing in the dark (NOT a literal
  // connected node/network diagram) ... must read as subtle, explicitly not
  // distracting." Deliberately no connecting lines between sparks — random,
  // independently-timed flashes only.
  const SPARK_COUNT = 14;

  function seededRandom(seed) {
    // Small deterministic PRNG so SSR and client render agree (avoids hydration
    // mismatch) rather than reaching for Math.random() per spark on each render.
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  const rand = seededRandom(42);
  const sparks = Array.from({ length: SPARK_COUNT }, (_, i) => ({
    id: i,
    x: rand() * 100,
    y: rand() * 100,
    size: 2 + rand() * 2.5,
    delay: rand() * 6,
    duration: 2.5 + rand() * 3,
  }));
</script>

<div class="synapse-layer" aria-hidden="true">
  {#each sparks as s (s.id)}
    <span
      class="spark"
      style={`left:${s.x}%; top:${s.y}%; width:${s.size}px; height:${s.size}px; animation-delay:${s.delay}s; animation-duration:${s.duration}s;`}
    ></span>
  {/each}
</div>

<style>
  .synapse-layer {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .spark {
    position: absolute;
    border-radius: 50%;
    background: #d7bdf5;
    opacity: 0;
    animation-name: flash;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    box-shadow: 0 0 4px 1px rgba(215, 189, 245, 0.5);
  }

  @keyframes flash {
    0%,
    88%,
    100% {
      opacity: 0;
      transform: scale(0.6);
    }
    94% {
      opacity: 0.85;
      transform: scale(1.15);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .spark {
      animation: none;
      opacity: 0.25;
    }
  }
</style>

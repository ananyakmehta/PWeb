<script>
  // DD_v2.1.md §5.1 — full replacement of v2's constellation starfield. Sitewide,
  // fixed-to-viewport dot field: dots ripple outward from the cursor and settle back
  // (not a persistent repel/displacement — carried forward from v1's CAD-car-block
  // mechanic), now covering the whole page rather than one block.
  //
  // Touch color, per direct instruction: not a single lit tone anymore — a rainbow
  // reveal, like a scratch-off card. Every dot's rainbow hue is deterministic from its
  // own grid position (hashHue below), not re-randomized per touch, so scratching the
  // same spot again always reveals the same color underneath rather than flickering to
  // a new one — that's what makes it read as "already there, being revealed" instead
  // of a random color picker following the cursor.
  //
  // Perf: fixed to the viewport (not sized to full document height) so the redraw cost
  // stays constant regardless of page length — this is what keeps it cheap "across the
  // full scroll length" per the doc's explicit ask, rather than redrawing an
  // ever-growing offscreen canvas. The rAF loop itself only runs while a ripple is
  // actually decaying; idle (grid unchanging, no ripples) it draws once and stops,
  // rather than paying every-frame cost for a static picture.
  import { onMount } from 'svelte';

  let canvas = $state(null);

  const SPACING = 22;
  const BASE_RADIUS = 1.0; // smaller than the v1 CAD-car version (was 1.4), per spec
  const MAX_BOOST = 3.0; // touched-dot radius = BASE_RADIUS + MAX_BOOST = 4.0, double the previous 2.0 max, per direct instruction
  const WAVE_SPEED = 340; // px/sec
  const RIPPLE_LIFETIME = 900; // ms
  const WAVE_WIDTH = 46; // px
  const REVEAL_THRESHOLD = 0.35; // boost level a dot needs before its rainbow color shows at all
  const RAINBOW_SATURATION = 68; // %  — fixed across every hue, see hashHue()
  const RAINBOW_LIGHTNESS = 70; // %  — "a little lighter" than a saturated rainbow; same shade for every hue

  // Deterministic pseudo-random hue in [0, 360) from a dot's own grid position — the
  // classic GLSL sin-hash trick. Same (x, y) always yields the same hue, which is the
  // whole point (see the file-level comment on why this isn't re-randomized per touch).
  function hashHue(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return (n - Math.floor(n)) * 360;
  }

  onMount(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d');
    const styles = getComputedStyle(document.documentElement);
    const bgColor = styles.getPropertyValue('--page-bg').trim();
    const dotColor = styles.getPropertyValue('--halftone-dot').trim();

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let ripples = [];
    let rafId = null;
    let lastSpawn = 0;
    let resizeTimer = null;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    }

    function draw(now) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      ripples = ripples.filter((r) => now - r.start < RIPPLE_LIFETIME);

      for (let y = SPACING / 2; y < height; y += SPACING) {
        for (let x = SPACING / 2; x < width; x += SPACING) {
          let radius = BASE_RADIUS;
          let color = dotColor;

          for (const r of ripples) {
            const age = now - r.start;
            const waveRadius = (age / 1000) * WAVE_SPEED;
            const dist = Math.hypot(x - r.x, y - r.y);
            const band = Math.abs(dist - waveRadius);
            if (band < WAVE_WIDTH) {
              const falloff = 1 - band / WAVE_WIDTH;
              const fade = 1 - age / RIPPLE_LIFETIME;
              const boost = falloff * fade;
              radius = Math.max(radius, BASE_RADIUS + MAX_BOOST * boost);
              if (boost > REVEAL_THRESHOLD) {
                const hue = hashHue(x, y);
                color = `hsla(${hue.toFixed(1)}, ${RAINBOW_SATURATION}%, ${RAINBOW_LIGHTNESS}%, ${Math.min(1, boost).toFixed(2)})`;
              }
            }
          }

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function loop(now) {
      draw(now);
      if (ripples.length > 0 && document.visibilityState === 'visible') {
        rafId = requestAnimationFrame(loop);
      } else {
        rafId = null;
      }
    }

    function ensureLoopRunning() {
      if (rafId === null) {
        rafId = requestAnimationFrame(loop);
      }
    }

    function handleMove(e) {
      const now = performance.now();
      if (now - lastSpawn > 220) {
        lastSpawn = now;
        ripples.push({ x: e.clientX, y: e.clientY, start: now });
        ensureLoopRunning();
      }
    }

    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 120);
    }

    function handleVisibility() {
      if (document.visibilityState === 'visible' && ripples.length > 0) {
        ensureLoopRunning();
      }
    }

    resize();

    if (!reducedMotion) {
      window.addEventListener('mousemove', handleMove, { passive: true });
      document.addEventListener('visibilitychange', handleVisibility);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(resizeTimer);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  });
</script>

<canvas bind:this={canvas} class="halftone-bg" aria-hidden="true"></canvas>

<style>
  .halftone-bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }
</style>

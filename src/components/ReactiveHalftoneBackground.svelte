<script>
  // DD_v2.1.md §5.1 — full replacement of v2's constellation starfield. Sitewide,
  // fixed-to-viewport reticle grid: small crosses at rest, extending into a connected
  // grid pattern and turning multicolored wherever the cursor has recently been —
  // experimental redesign of the previous dot-ripple mechanic, per direct instruction.
  //
  // Mechanic: not an expanding ring wave anymore — a decaying position trail. Every
  // recent cursor position (TRAIL sampled on mousemove, see handleMove) stays "hot" for
  // TRAIL_LIFETIME (500ms — "lingers for half a second"), and every cross's activation
  // is the strongest pull from any trail point within ACTIVATION_RADIUS of it (closer +
  // fresher = stronger, see activationFrom()). Moving the cursor leaves a fading tail of
  // still-hot trail points behind it — that's the trail; standing still just leaves one
  // hot spot that decays in place once you stop adding new samples.
  //
  // Color, carried over from the previous dot version: not a single lit tone — a
  // rainbow reveal, like a scratch-off card. Every cross's rainbow hue is deterministic
  // from its own grid position (hashHue below), not re-randomized per touch, so
  // touching the same spot again always reveals the same color underneath rather than
  // flickering to a new one each time.
  //
  // Perf: fixed to the viewport (not sized to full document height) so the redraw cost
  // stays constant regardless of page length. The rAF loop only runs while at least one
  // trail point is still alive; idle (no recent movement) it draws once and stops,
  // rather than paying every-frame cost for a static picture.
  import { onMount } from 'svelte';

  let canvas = $state(null);

  const SPACING = 22;
  const BASE_ARM = 3; // rest-state cross arm length (px), each arm — small tick mark
  const MAX_ARM = 12; // fully-activated arm length — slightly over SPACING/2 (11) so
  // neighboring crosses' arms visibly meet/overlap into a continuous grid line instead
  // of stopping just short of each other
  const BASE_LINE_WIDTH = 1;
  const MAX_LINE_WIDTH = 1.6;
  const ACTIVATION_RADIUS = 70; // px — "a certain radius" around each trail point
  const TRAIL_LIFETIME = 500; // ms — "lingers for half a second"
  const TRAIL_SAMPLE_INTERVAL = 30; // ms between recorded trail points; dense enough for a smooth, unbroken trail
  const REVEAL_THRESHOLD = 0.15; // activation level before a cross's color starts shifting toward rainbow at all
  const RAINBOW_SATURATION = 68; // %  — fixed across every hue, see hashHue()
  const RAINBOW_LIGHTNESS = 70; // %  — "a little lighter" than a saturated rainbow; same shade for every hue

  // Deterministic pseudo-random hue in [0, 360) from a cross's own grid position — the
  // classic GLSL sin-hash trick. Same (x, y) always yields the same hue, which is the
  // whole point (see the file-level comment on why this isn't re-randomized per touch).
  function hashHue(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return (n - Math.floor(n)) * 360;
  }

  // Strongest pull any single trail point exerts on a grid position: 0 outside
  // ACTIVATION_RADIUS or once a point is fully aged out, up to 1 right at a
  // just-recorded point's exact position. Distance and age factors multiply — a point
  // has to be both close AND fresh to activate strongly, which is what makes the
  // trail's leading edge (near the cursor) read as the strongest part.
  function activationFrom(x, y, trail, now) {
    let strongest = 0;
    for (const t of trail) {
      const dist = Math.hypot(x - t.x, y - t.y);
      if (dist >= ACTIVATION_RADIUS) continue;
      const distFactor = 1 - dist / ACTIVATION_RADIUS;
      const age = now - t.time;
      const ageFactor = Math.max(0, 1 - age / TRAIL_LIFETIME);
      const activation = distFactor * ageFactor;
      if (activation > strongest) strongest = activation;
    }
    return strongest;
  }

  onMount(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    const styles = getComputedStyle(document.documentElement);
    const bgColor = styles.getPropertyValue('--page-bg').trim();
    const crossColor = styles.getPropertyValue('--halftone-dot').trim();

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let trail = [];
    let rafId = null;
    let lastSample = 0;
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

      trail = trail.filter((t) => now - t.time < TRAIL_LIFETIME);

      for (let y = SPACING / 2; y < height; y += SPACING) {
        for (let x = SPACING / 2; x < width; x += SPACING) {
          const activation = trail.length > 0 ? activationFrom(x, y, trail, now) : 0;
          const arm = BASE_ARM + (MAX_ARM - BASE_ARM) * activation;

          let color = crossColor;
          if (activation > REVEAL_THRESHOLD) {
            const hue = hashHue(x, y);
            color = `hsla(${hue.toFixed(1)}, ${RAINBOW_SATURATION}%, ${RAINBOW_LIGHTNESS}%, ${Math.min(1, activation).toFixed(2)})`;
          }

          ctx.strokeStyle = color;
          ctx.lineWidth = BASE_LINE_WIDTH + (MAX_LINE_WIDTH - BASE_LINE_WIDTH) * activation;
          ctx.beginPath();
          ctx.moveTo(x - arm, y);
          ctx.lineTo(x + arm, y);
          ctx.moveTo(x, y - arm);
          ctx.lineTo(x, y + arm);
          ctx.stroke();
        }
      }
    }

    function loop(now) {
      draw(now);
      if (trail.length > 0 && document.visibilityState === 'visible') {
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
      if (now - lastSample > TRAIL_SAMPLE_INTERVAL) {
        lastSample = now;
        trail.push({ x: e.clientX, y: e.clientY, time: now });
        ensureLoopRunning();
      }
    }

    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 120);
    }

    function handleVisibility() {
      if (document.visibilityState === 'visible' && trail.length > 0) {
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

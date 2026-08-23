<script>
  // DD_v2.1.md §5.1 — full replacement of v2's constellation starfield. Sitewide,
  // fixed-to-viewport reticle grid: small dots at rest — crosses read as "busy" when
  // every point on the page has visible arms at once, dots don't — that extend arms
  // outward from themselves and turn multicolored wherever the cursor has recently
  // been. Experimental redesign of the previous dot-ripple mechanic, per direct
  // instruction (iterated twice now: crosses-everywhere → dots-at-rest-with-growing-arms).
  //
  // Mechanic: not an expanding ring wave — a decaying position trail. Every recent
  // cursor position (TRAIL sampled on mousemove, see handleMove) stays "hot" for
  // TRAIL_LIFETIME (500ms — "lingers for half a second"), and every dot's activation is
  // the strongest pull from any trail point within OUTER_RADIUS of it (see
  // activationFrom()). Moving the cursor leaves a fading tail of still-hot trail points
  // behind it — that's the trail; standing still just leaves one hot spot that decays in
  // place once you stop adding new samples.
  //
  // Distance falloff is a plateau (INNER_RADIUS) + taper (out to OUTER_RADIUS), not a
  // single-point peak: per direct feedback, a straight linear falloff from the trail
  // point meant only the exact dot under the cursor ever reached full activation, so
  // neighboring dots' arms only ever "barely touched" instead of actually joining.
  // Holding activation at 1 for every dot within INNER_RADIUS means a whole neighborhood
  // of dots reaches max arm length together, so their arms genuinely overlap into a
  // connected grid patch rather than just grazing each other at a single point.
  //
  // Color, carried over from the previous versions: not a single lit tone — a rainbow
  // reveal, like a scratch-off card. Every dot's rainbow hue is deterministic from its
  // own grid position (hashHue below), not re-randomized per touch, so touching the same
  // spot again always reveals the same color underneath rather than flickering to a new
  // one each time.
  //
  // Perf: fixed to the viewport (not sized to full document height) so the redraw cost
  // stays constant regardless of page length. The rAF loop only runs while at least one
  // trail point is still alive; idle (no recent movement) it draws once and stops,
  // rather than paying every-frame cost for a static picture.
  import { onMount } from 'svelte';
  import { getRainbowEnabled, onRainbowEnabledChange } from '../lib/staticMode';

  let canvas = $state(null);

  const SPACING = 22;
  const BASE_DOT_RADIUS = 1.2; // rest-state dot, roughly constant regardless of activation — only the arms grow
  const MAX_ARM = 14; // fully-activated arm length — past SPACING/2 (11) with real margin,
  // so neighboring dots' arms clearly overlap into a connected grid line instead of
  // just meeting at a point
  const BASE_LINE_WIDTH = 1;
  const MAX_LINE_WIDTH = 1.6;
  const INNER_RADIUS = 35; // px — within this distance of a trail point, activation holds at its full (age-limited) strength
  const OUTER_RADIUS = 110; // px — activation tapers from INNER_RADIUS out to 0 here
  const TRAIL_LIFETIME = 500; // ms — "lingers for half a second"
  const TRAIL_SAMPLE_INTERVAL = 30; // ms between recorded trail points; dense enough for a smooth, unbroken trail
  const REVEAL_THRESHOLD = 0.15; // activation level before a dot's color starts shifting toward rainbow at all
  const RAINBOW_SATURATION = 68; // %  — fixed across every hue, see hashHue()
  const RAINBOW_LIGHTNESS = 70; // %  — "a little lighter" than a saturated rainbow; same shade for every hue

  // Text-avoidance: per direct feedback, the grown/colored grid was landing right
  // behind readable text and making it harder to read. Rather than a z-index trick
  // (the canvas is already behind everything — the issue is legibility, not stacking
  // order), grid points inside a real text element's own box (plus a small buffer)
  // are simply excluded from activation entirely, so they stay at rest regardless of
  // how close the cursor trail gets.
  const TEXT_ZONE_SELECTOR = 'h1, h2, h3, h4, h5, h6, p, a, li, label';
  const TEXT_ZONE_BUFFER = 8; // px — "a couple pixels" of clearance around each text box
  const TEXT_ZONE_RECOMPUTE_INTERVAL = 200; // ms — text moves on scroll/resize/content changes; cheap enough to just re-measure periodically rather than wiring up scroll listeners for it

  // Deterministic pseudo-random hue in [0, 360) from a dot's own grid position — the
  // classic GLSL sin-hash trick. Same (x, y) always yields the same hue, which is the
  // whole point (see the file-level comment on why this isn't re-randomized per touch).
  function hashHue(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return (n - Math.floor(n)) * 360;
  }

  // Strongest pull any single trail point exerts on a grid position: full (age-limited)
  // strength for anything within INNER_RADIUS, tapering linearly to 0 by OUTER_RADIUS,
  // 0 beyond that. Age factor multiplies on top — a point has to be both within range
  // AND fresh to activate strongly, which is what makes the trail's leading edge (near
  // the cursor) read as the strongest part.
  function activationFrom(x, y, trail, now) {
    let strongest = 0;
    for (const t of trail) {
      const dist = Math.hypot(x - t.x, y - t.y);
      if (dist >= OUTER_RADIUS) continue;
      const distFactor = dist <= INNER_RADIUS ? 1 : 1 - (dist - INNER_RADIUS) / (OUTER_RADIUS - INNER_RADIUS);
      const age = now - t.time;
      const ageFactor = Math.max(0, 1 - age / TRAIL_LIFETIME);
      const activation = distFactor * ageFactor;
      if (activation > strongest) strongest = activation;
    }
    return strongest;
  }

  onMount(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Static mode toggle (top-right corner, StaticModeToggle.svelte) — direct
    // instruction. Gates the same mousemove-driven reactivity reducedMotion
    // already gates below, so flipping it off leaves exactly the flat,
    // rest-state dot grid (no arms, no rainbow reveal) with nothing extra to
    // special-case in draw() itself.
    let rainbowEnabled = getRainbowEnabled();
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    const styles = getComputedStyle(document.documentElement);
    const bgColor = styles.getPropertyValue('--page-bg').trim();
    const dotColor = styles.getPropertyValue('--halftone-dot').trim();

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let trail = [];
    let rafId = null;
    let lastSample = 0;
    let resizeTimer = null;
    let textZones = [];
    let lastZoneCompute = 0;

    function computeTextZones() {
      const els = document.querySelectorAll(TEXT_ZONE_SELECTOR);
      const zones = [];
      for (const el of els) {
        if (!el.textContent || !el.textContent.trim()) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        zones.push({
          left: r.left - TEXT_ZONE_BUFFER,
          right: r.right + TEXT_ZONE_BUFFER,
          top: r.top - TEXT_ZONE_BUFFER,
          bottom: r.bottom + TEXT_ZONE_BUFFER,
        });
      }
      textZones = zones;
    }

    function inTextZone(x, y) {
      for (const z of textZones) {
        if (x >= z.left && x <= z.right && y >= z.top && y <= z.bottom) return true;
      }
      return false;
    }

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

      if (now - lastZoneCompute > TEXT_ZONE_RECOMPUTE_INTERVAL) {
        computeTextZones();
        lastZoneCompute = now;
      }

      for (let y = SPACING / 2; y < height; y += SPACING) {
        for (let x = SPACING / 2; x < width; x += SPACING) {
          const activation = trail.length > 0 && !inTextZone(x, y) ? activationFrom(x, y, trail, now) : 0;
          const arm = MAX_ARM * activation; // 0 at rest — the dot only grows arms once touched

          let color = dotColor;
          if (activation > REVEAL_THRESHOLD) {
            const hue = hashHue(x, y);
            color = `hsla(${hue.toFixed(1)}, ${RAINBOW_SATURATION}%, ${RAINBOW_LIGHTNESS}%, ${Math.min(1, activation).toFixed(2)})`;
          }

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, BASE_DOT_RADIUS, 0, Math.PI * 2);
          ctx.fill();

          if (arm > 0.5) {
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
      if (!rainbowEnabled) return;
      const now = performance.now();
      if (now - lastSample > TRAIL_SAMPLE_INTERVAL) {
        lastSample = now;
        trail.push({ x: e.clientX, y: e.clientY, time: now });
        ensureLoopRunning();
      }
    }

    function handleRainbowEnabledChange(value) {
      rainbowEnabled = value;
      if (!rainbowEnabled) {
        // Snap straight to rest instead of waiting out the trail's normal
        // TRAIL_LIFETIME decay — "static" should read as instantly still, not
        // a slow fade after the toggle's already been flipped off.
        trail = [];
        draw(performance.now());
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
    const unsubscribeRainbow = onRainbowEnabledChange(handleRainbowEnabledChange);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(resizeTimer);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      unsubscribeRainbow();
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

<script>
  // DD_initial_build.md §8.3 (CAD Car block-specific background effect): "Halftone dot
  // field, dots ripple outward from cursor position and settle back (not a persistent
  // repel/displacement)." Implemented as a canvas dot grid; cursor movement spawns a
  // radial wave that temporarily enlarges dots near its expanding front, which then
  // decays back to baseline — not a hover-follows-cursor displacement field.
  import { onMount } from 'svelte';

  let canvas = $state(null);
  let reducedMotion = false;

  const SPACING = 20;
  const BASE_RADIUS = 1.4;
  const MAX_BOOST = 2.6;
  const WAVE_SPEED = 340; // px/sec
  const RIPPLE_LIFETIME = 900; // ms
  const WAVE_WIDTH = 46; // px, how wide the enlarged band around the wavefront is

  onMount(() => {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d');
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let ripples = [];
    let rafId = null;
    let lastSpawn = 0;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawStatic() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(245, 198, 214, 0.28)';
      for (let y = SPACING / 2; y < height; y += SPACING) {
        for (let x = SPACING / 2; x < width; x += SPACING) {
          ctx.beginPath();
          ctx.arc(x, y, BASE_RADIUS, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function draw(now) {
      ctx.clearRect(0, 0, width, height);
      ripples = ripples.filter((r) => now - r.start < RIPPLE_LIFETIME);

      for (let y = SPACING / 2; y < height; y += SPACING) {
        for (let x = SPACING / 2; x < width; x += SPACING) {
          let radius = BASE_RADIUS;
          let alpha = 0.28;

          for (const r of ripples) {
            const age = now - r.start;
            const waveRadius = (age / 1000) * WAVE_SPEED;
            const dist = Math.hypot(x - r.x, y - r.y);
            const band = Math.abs(dist - waveRadius);
            if (band < WAVE_WIDTH) {
              const falloff = 1 - band / WAVE_WIDTH;
              const fade = 1 - age / RIPPLE_LIFETIME;
              const boost = MAX_BOOST * falloff * fade;
              radius = Math.max(radius, BASE_RADIUS + boost);
              alpha = Math.max(alpha, Math.min(0.9, 0.28 + falloff * fade * 0.7));
            }
          }

          ctx.fillStyle = `rgba(245, 198, 214, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafId = requestAnimationFrame(draw);
    }

    function handleMove(e) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      const now = performance.now();
      if (now - lastSpawn > 220) {
        lastSpawn = now;
        ripples.push({ x, y, start: now });
      }
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    if (reducedMotion) {
      drawStatic();
    } else {
      window.addEventListener('mousemove', handleMove, { passive: true });
      rafId = requestAnimationFrame(draw);
    }

    return () => {
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMove);
    };
  });
</script>

<canvas bind:this={canvas} class="halftone-canvas" aria-hidden="true"></canvas>

<style>
  .halftone-canvas {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }
</style>

<script>
  // DD_initial_build.md §9.2 — CAD Car F1 scroll-into-view animation. Requirements are
  // specific enough (exact easing curve, particle trail tied to the car's real
  // position, text lag relative to the car) that a JS-driven rAF loop sampling the
  // named cubic-bezier is used instead of a plain CSS transition, so the dust trail can
  // be spawned at the car's true instantaneous position rather than guessed.
  import { onDestroy } from 'svelte';

  let { active = false } = $props();

  let containerEl = $state(null);
  let carX = $state(0);
  let textX = $state(0);
  let textOpacity = $state(0);
  let particles = $state([]);

  let rafId = null;
  let particleId = 0;

  const DURATION = 1400; // ms
  const TEXT_LAG = 140; // ms — text visibly trails the car, not rigidly attached
  const CAR_WIDTH = 80;
  // The caption is far wider than the 80px car icon, so it can't reuse the car's
  // full-strip-width travel formula (translating a wide, left-anchored text block that
  // far left clips its own start against the strip's overflow:hidden edge). Instead it
  // settles from a small offset into its resting position, staying fully on-screen and
  // legible throughout — while still visibly trailing the car via TEXT_LAG and its own
  // fade-in.
  const TEXT_SETTLE_OFFSET = 70; // px

  // Standard Newton-Raphson cubic-bezier sampler (control points fixed per spec:
  // cubic-bezier(0.16, 1, 0.3, 1) — most distance covered in the first 30-40%,
  // continuing-but-slowing after. Explicitly not linear or ease-in-out.
  function cubicBezier(p1x, p1y, p2x, p2y) {
    const A = (a1, a2) => 1 - 3 * a2 + 3 * a1;
    const B = (a1, a2) => 3 * a2 - 6 * a1;
    const C = (a1) => 3 * a1;
    const calc = (t, a1, a2) => ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t;
    const slope = (t, a1, a2) => 3 * A(a1, a2) * t * t + 2 * B(a1, a2) * t + C(a1);
    return function (x) {
      let t = x;
      for (let i = 0; i < 6; i++) {
        const s = slope(t, p1x, p2x);
        if (s === 0) break;
        t -= (calc(t, p1x, p2x) - x) / s;
      }
      return calc(t, p1y, p2y);
    };
  }

  const ease = cubicBezier(0.16, 1, 0.3, 1);

  function spawnParticle(x, y) {
    const id = particleId++;
    particles = [...particles, { id, x, y }];
    setTimeout(() => {
      particles = particles.filter((p) => p.id !== id);
    }, 1000);
  }

  function play() {
    if (!containerEl) return;
    const width = containerEl.clientWidth;
    const totalTravel = width + CAR_WIDTH;

    // Checked fresh rather than trusting the onMount-populated `reducedMotion` var:
    // this can run from the $effect below on the very first mount tick, before
    // onMount is guaranteed to have set it (confirmed via testing on the sibling
    // MarbleTrough component, which had the identical bug).
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      carX = -CAR_WIDTH;
      textX = 0;
      textOpacity = 1;
      return;
    }

    const start = performance.now();
    let lastParticle = 0;

    function frame(now) {
      const elapsed = now - start;
      const t = Math.max(0, Math.min(1, elapsed / DURATION));
      carX = width - ease(t) * totalTravel;

      const tt = Math.max(0, Math.min(1, (elapsed - TEXT_LAG) / DURATION));
      textX = (1 - ease(tt)) * TEXT_SETTLE_OFFSET;
      textOpacity = Math.max(0, Math.min(1, (elapsed - TEXT_LAG) / 220));

      if (elapsed - lastParticle > 45 && t < 1) {
        lastParticle = elapsed;
        spawnParticle(carX + CAR_WIDTH - 6, 30 + (Math.random() * 8 - 4));
      }

      if (t < 1) {
        rafId = requestAnimationFrame(frame);
      }
    }

    rafId = requestAnimationFrame(frame);
  }

  $effect(() => {
    if (active) {
      play();
    } else if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  });

  onDestroy(() => {
    if (rafId) cancelAnimationFrame(rafId);
  });
</script>

<div class="car-strip" bind:this={containerEl} aria-hidden="true">
  <div class="car" style={`transform: translateX(${carX}px);`}>
    <svg width="80" height="34" viewBox="0 0 80 34">
      <path
        d="M4 24 Q4 14 16 13 L28 6 L52 6 L62 13 L76 15 Q78 16 78 20 L78 24 Z"
        fill="#f7f7fb"
      />
      <circle cx="20" cy="26" r="6" fill="#1a1a1a" />
      <circle cx="60" cy="26" r="6" fill="#1a1a1a" />
    </svg>
  </div>
  <div class="trail-text" style={`transform: translateX(${textX}px); opacity:${textOpacity};`}>
    [Placeholder] — acceleration test —
  </div>
  {#each particles as p (p.id)}
    <span class="dust" style={`left:${p.x}px; top:${p.y}px;`}></span>
  {/each}
</div>

<style>
  .car-strip {
    position: relative;
    height: 64px;
    margin: 0.75rem 0;
    overflow: hidden;
  }

  .car {
    position: absolute;
    top: 4px;
    left: 0;
    will-change: transform;
  }

  .trail-text {
    position: absolute;
    top: 42px;
    left: 0;
    white-space: nowrap;
    font-size: 0.78rem;
    font-style: italic;
    color: var(--block-text-secondary);
    will-change: transform, opacity;
  }

  .dust {
    position: absolute;
    top: 0;
    left: 0;
    width: 5px;
    height: 5px;
    margin: -2.5px 0 0 -2.5px;
    border-radius: 50%;
    background: #f2a6c4;
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
    .dust {
      display: none;
    }
  }
</style>

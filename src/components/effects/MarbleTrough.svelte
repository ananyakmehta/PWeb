<script>
  // DD_initial_build.md §9.4 — Mount Sinai marble/orb trough reveal. Plays once
  // automatically the first time the block scrolls into view; after that, only the
  // replay icon re-triggers it (the doc frames replay as a deliberate manual action,
  // not something that should re-fire every time the block re-enters view). Original
  // color/material treatment only — flat radial-gradient shading, no glow/blur halo,
  // and no connected-node styling anywhere near this component.
  import { onMount } from 'svelte';

  let { active = false } = $props();

  const SLOTS = [
    { id: 0, text: '[Placeholder] Accuracy: 91.2%' },
    { id: 1, text: '[Placeholder] Samples: 1,204' },
    { id: 2, text: '[Placeholder] Runtime: 3.4s' },
    { id: 3, text: '[Placeholder] F1 score: 0.88' },
  ];
  const MARBLE_COLORS = ['#9b7fc7', '#7c5fb0', '#b79bd6', '#8a6bc4'];
  const STAGGER = 220; // ms
  const FALL_DURATION = 650; // ms

  let hasPlayed = $state(false);
  let playing = $state(false);
  let revealed = $state(new Set());
  let playKey = $state(0);
  let timeouts = [];

  function clearTimeouts() {
    timeouts.forEach(clearTimeout);
    timeouts = [];
  }

  function runSequence() {
    playing = true;
    revealed = new Set();
    clearTimeouts();
    SLOTS.forEach((slot, i) => {
      const t = setTimeout(
        () => {
          revealed = new Set([...revealed, slot.id]);
          if (i === SLOTS.length - 1) {
            const doneT = setTimeout(() => {
              playing = false;
            }, 200);
            timeouts.push(doneT);
          }
        },
        i * STAGGER + FALL_DURATION
      );
      timeouts.push(t);
    });
  }

  function trigger() {
    hasPlayed = true;
    // Checked fresh here rather than via an onMount-populated variable: this can be
    // called from the $effect below on the very first mount tick, which is not
    // guaranteed to run after onMount has had a chance to set anything (bit us in
    // testing — the staggered reveal ran in full despite reduced-motion being active).
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealed = new Set(SLOTS.map((s) => s.id));
      playing = false;
      return;
    }
    playKey += 1;
    runSequence();
  }

  $effect(() => {
    if (active && !hasPlayed) {
      trigger();
    }
  });

  onMount(() => {
    return () => clearTimeouts();
  });
</script>

<div class="trough-wrap">
  {#key playKey}
    <div class="trough">
      {#each SLOTS as slot, i (slot.id)}
        <div class="slot">
          <div class="slot-content" class:revealed={revealed.has(slot.id)}>{slot.text}</div>
          <div
            class="marble"
            style={`background: radial-gradient(circle at 35% 32%, rgba(255,255,255,0.55), transparent 42%), ${MARBLE_COLORS[i % MARBLE_COLORS.length]}; animation-delay:${i * STAGGER}ms;`}
          ></div>
          <div class="slot-mouth"></div>
        </div>
      {/each}
    </div>
  {/key}

  {#if hasPlayed && !playing}
    <button
      type="button"
      class="replay-btn"
      onclick={trigger}
      aria-label="Replay the marble reveal animation"
    >
      ↻
    </button>
  {/if}
</div>

<style>
  .trough-wrap {
    display: flex;
    align-items: flex-end;
    gap: 0.75rem;
    margin-top: 1.25rem;
  }

  .trough {
    display: flex;
    gap: 0.6rem;
    flex: 1;
  }

  .slot {
    position: relative;
    flex: 1;
    height: 84px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    overflow: hidden;
  }

  .slot-content {
    font-size: 0.7rem;
    color: var(--block-text-secondary);
    text-align: center;
    opacity: 0;
    transform: translateY(6px);
    transition: opacity 300ms ease, transform 300ms ease;
    margin-bottom: 0.4rem;
    padding: 0 0.2rem;
  }

  .slot-content.revealed {
    opacity: 1;
    transform: translateY(0);
  }

  .marble {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    margin-bottom: 4px;
    animation: marble-fall 650ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  .slot-mouth {
    width: 100%;
    height: 8px;
    border-radius: 4px 4px 0 0;
    background: rgba(0, 0, 0, 0.35);
  }

  @keyframes marble-fall {
    0% {
      transform: translateY(-70px) scale(0.9);
    }
    70% {
      transform: translateY(4px) scale(1.05);
    }
    85% {
      transform: translateY(-3px) scale(0.98);
    }
    100% {
      transform: translateY(0) scale(1);
    }
  }

  .replay-btn {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.06);
    color: var(--block-text-secondary);
    cursor: pointer;
    font-size: 0.95rem;
    line-height: 1;
    margin-bottom: 4px;
    transition: background 150ms ease, color 150ms ease;
  }

  .replay-btn:hover {
    background: rgba(255, 255, 255, 0.14);
    color: var(--block-accent);
  }

  @media (prefers-reduced-motion: reduce) {
    .marble {
      animation: none;
    }
    .slot-content {
      transition: none;
    }
  }
</style>

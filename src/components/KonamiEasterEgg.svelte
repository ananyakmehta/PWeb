<script>
  // Fun easter egg, direct instruction. Global keydown listener — works from any page,
  // not just the hero — watches for the classic Konami code (up up down down left
  // right left right b a enter). The hint pointing at this ("konami code?", fading in
  // near the swing on hover) lives on the hero specifically, but the code itself
  // isn't scoped to being there; that's the traditional way this kind of easter egg
  // works, and there's nothing hero-specific about the trigger itself.
  //
  // On a match: darken the whole screen and spin a banana — a real, sourced icon
  // (uxwing.com/banana-icon/, no attribution needed per its license page), not
  // hand-drawn, same standard as every other icon on this site.
  //
  // The whole sequence (darken, banana fades in over 1s, spins 3 full turns, fades
  // out over 1s, screen back to normal) is one CSS animation each on the overlay and
  // the banana, both ANIMATION_DURATION long, triggered by mounting the overlay via
  // {#if active} — Svelte destroys/recreates the element on each toggle, which is
  // what makes a non-looping CSS animation replay correctly on a second trigger
  // rather than staying stuck at its finished state.
  import { onMount } from 'svelte';
  import bananaSrc from '../assets/decor/banana.svg';

  const SEQUENCE = [
    'arrowup',
    'arrowup',
    'arrowdown',
    'arrowdown',
    'arrowleft',
    'arrowright',
    'arrowleft',
    'arrowright',
    'b',
    'a',
    'enter',
  ];
  const ANIMATION_DURATION = 3200; // ms — must match the <style> keyframes' duration below

  let active = $state(false);

  onMount(() => {
    let buffer = [];
    let playing = false;

    function handleKeydown(e) {
      if (playing) return;

      const target = document.activeElement;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;

      buffer.push(e.key.toLowerCase());
      if (buffer.length > SEQUENCE.length) buffer.shift();

      if (buffer.length === SEQUENCE.length && buffer.every((k, i) => k === SEQUENCE[i])) {
        buffer = [];
        playing = true;
        active = true;
        setTimeout(() => {
          active = false;
          playing = false;
        }, ANIMATION_DURATION);
      }
    }

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

{#if active}
  <div class="konami-overlay" aria-hidden="true">
    <!-- Astro's asset import gives an object ({src, width, height, format}), not a
         plain URL string, outside of the <Image> component — .src is what a raw
         <img> tag actually needs. -->
    <img src={bananaSrc.src} alt="" class="konami-banana" />
  </div>
{/if}

<style>
  .konami-overlay {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    background: rgba(4, 6, 16, 0.85);
    animation: konami-overlay-fade 3.2s ease-in-out;
  }

  .konami-banana {
    width: 180px;
    height: auto;
    animation: konami-banana-spin 3.2s ease-in-out;
  }

  /* Percentages here are fractions of the 3.2s total: 1s fade-in = 31.25%, +1.2s
     spin = 68.75%, +1s fade-out = 100%. */
  @keyframes konami-overlay-fade {
    0% {
      opacity: 0;
    }
    31.25% {
      opacity: 1;
    }
    68.75% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  @keyframes konami-banana-spin {
    0% {
      opacity: 0;
      transform: scale(0.6) rotate(0deg);
    }
    31.25% {
      opacity: 1;
      transform: scale(1) rotate(0deg);
      /* Linear from here through the spin segment (68.75%) — constant rotation
         speed is what reads as "spinning rapidly" rather than easing in/out of it. */
      animation-timing-function: linear;
    }
    68.75% {
      opacity: 1;
      /* 3 full turns */
      transform: scale(1) rotate(1080deg);
    }
    100% {
      opacity: 0;
      transform: scale(0.6) rotate(1080deg);
    }
  }
</style>

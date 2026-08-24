<script>
  // Reusable "nerd numbers" collapsible aside — direct instruction: an optional
  // per-section dropdown for extra detail/stats, default retracted (flipped from an
  // earlier default-expanded pass per direct feedback), that expands/retracts on
  // click, in a distinct (light blue) color from the regular body text, and built to
  // scale to any project's sections rather than being specific to one. Driven
  // entirely by the `sections[].nerdNumbers` field in the content collection (see
  // src/content.config.ts) — ProjectDetail.astro renders one of these per section
  // that has that field set, passing in the already-paragraph-split text (see
  // src/lib/text.ts's splitParagraphs()).
  let { paragraphs, label = 'Nerd numbers' } = $props();

  let expanded = $state(false);
</script>

<div class="nerd-numbers">
  <button
    type="button"
    class="toggle"
    aria-expanded={expanded}
    onclick={() => (expanded = !expanded)}
  >
    <span class="chevron" class:collapsed={!expanded} aria-hidden="true">▾</span>
    {label}
  </button>
  <div class="body-wrap" class:collapsed={!expanded}>
    <div class="body-inner">
      {#each paragraphs as p}
        <p>{p}</p>
      {/each}
    </div>
  </div>
</div>

<style>
  .nerd-numbers {
    margin-top: 1rem;
  }

  .toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0;
    border: none;
    background: none;
    font: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    /* Distinct from the surrounding white/dim body text per direct instruction — a
       very light blue, defined once in global.css so every instance of this
       component (any project, any section) stays in sync. */
    color: var(--nerd-blue);
    cursor: pointer;
  }

  .toggle:hover {
    color: var(--nerd-blue-hover);
  }

  .chevron {
    display: inline-block;
    transition: transform 200ms ease;
  }

  .chevron.collapsed {
    transform: rotate(-90deg);
  }

  /* grid-template-rows 1fr/0fr is what makes this animate smoothly without
     measuring the content's own height in JS — .body-inner's overflow:hidden clips
     it during the transition. */
  .body-wrap {
    display: grid;
    grid-template-rows: 1fr;
    transition: grid-template-rows 250ms ease;
  }

  .body-wrap.collapsed {
    grid-template-rows: 0fr;
  }

  .body-inner {
    overflow: hidden;
  }

  .body-wrap :global(p) {
    margin: 0.6rem 0 0;
    color: var(--nerd-blue);
    line-height: 1.6;
  }

  .body-wrap :global(p:first-child) {
    margin-top: 0.6rem;
  }
</style>

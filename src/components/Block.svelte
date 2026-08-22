<script>
  // DD_initial_build.md §6 — ONE shared component for every block, in both the main
  // feed and the Other section (§6.2, §7). Block-specific "middle content" (§6.4-§6.7)
  // is picked by which optional fields are present on the block, not by block identity
  // — the two `block.slug === 'cad-car' | 'mount-sinai'` checks below are the only
  // identity-based branches, and they exist only to mount each block's own bespoke
  // easter-egg component (§9.2, §9.4), which isn't something a generic field-presence
  // check can drive.
  import { onMount } from 'svelte';
  import StatusDot from './StatusDot.svelte';
  import HalftoneRipple from './effects/HalftoneRipple.svelte';
  import SpiralVortex from './effects/SpiralVortex.svelte';
  import SynapseSparks from './effects/SynapseSparks.svelte';
  import CarAccelAnimation from './effects/CarAccelAnimation.svelte';
  import MarbleTrough from './effects/MarbleTrough.svelte';

  let { block, theme, activeTypeTags = [], activeTopicTags = [] } = $props();

  let rootEl = $state(null);
  let inView = $state(false);

  onMount(() => {
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
      },
      { threshold: 0.15 }
    );
    io.observe(rootEl);
    return () => io.disconnect();
  });

  const dateRange = $derived(`${block.dateStart} – ${block.dateEnd ?? 'Ongoing'}`);
  const allTags = $derived([
    ...block.typeTags.map((t) => ({ key: t, group: 'type' })),
    ...block.topicTags.map((t) => ({ key: t, group: 'topic' })),
  ]);

  function isMatched(tag) {
    const active = tag.group === 'type' ? activeTypeTags : activeTopicTags;
    return active.length > 0 && active.includes(tag.key);
  }
</script>

<section
  class="block"
  bind:this={rootEl}
  style={`--block-bg:${theme.background}; --block-accent:${theme.accent}; --block-text-secondary:${theme.textSecondary};`}
  data-cursor-override={theme.cursorOverride !== 'none' ? theme.cursorOverride : undefined}
>
  {#if inView}
    {#if theme.effect === 'halftone'}
      <HalftoneRipple />
    {:else if theme.effect === 'spiral'}
      <SpiralVortex />
    {:else if theme.effect === 'synapses'}
      <SynapseSparks />
    {/if}
  {/if}

  <div class="block-content">
    <h2>{block.title}</h2>
    <p class="date-range">{dateRange}</p>
    <StatusDot status={block.status} />

    {#if allTags.length > 0}
      <div class="tags">
        {#each allTags as tag (tag.group + ':' + tag.key)}
          <span class="tag" class:matched={isMatched(tag)}>{tag.key}</span>
        {/each}
      </div>
    {/if}

    <p class="description">{block.primaryDescription}</p>

    {#if block.slug === 'cad-car'}
      <CarAccelAnimation active={inView} />
    {/if}

    {#if block.images?.length}
      <div class={`image-grid count-${block.images.length}`}>
        {#each block.images as img}
          <figure>
            <img src={img.src} width={img.width} height={img.height} alt={img.alt} loading="lazy" />
            {#if img.caption}<figcaption>{img.caption}</figcaption>{/if}
          </figure>
        {/each}
      </div>
    {/if}

    <!-- Block-specific middle content, §6.4-§6.7 — routed by field presence, per §6.2 -->
    {#if block.versions?.length}
      <div class="versions-block">
        <p class="current-version">
          <strong>{block.versions[0].label}</strong>
          {#if block.versions[0].specs}<span> — {block.versions[0].specs}</span>{/if}
          {#if block.links?.length}
            <a class="inline-link" href={block.links[0].url}>{block.links[0].label}</a>
          {/if}
        </p>
        {#if block.versions.length > 1}
          <div class="previous-versions">
            <p class="previous-versions-label">Previous versions</p>
            <ul>
              {#each block.versions.slice(1) as v}
                <li>
                  <strong>{v.label}</strong>
                  {#if v.specs}<span> — {v.specs}</span>{/if}
                  {#if v.cadUrl}<a class="inline-link" href={v.cadUrl}>CAD</a>{/if}
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    {:else if block.currentWork}
      <p class="current-work">{block.currentWork}</p>
    {:else if block.impact}
      <p class="impact">{block.impact}</p>
      {#if block.links?.length}
        <div class="links-row">
          {#each block.links as l}
            <a class="inline-link" href={l.url}>{l.label}</a>
          {/each}
        </div>
      {/if}
    {:else if block.links?.length}
      <div class="links-row">
        {#each block.links as l}
          <a class="inline-link" href={l.url}>{l.label}</a>
        {/each}
      </div>
    {/if}

    {#if block.slug === 'mount-sinai'}
      <MarbleTrough active={inView} />
    {/if}

    {#if block.tools?.length}
      <p class="tools-row"><span class="tools-label">Tools:</span> {block.tools.join(' · ')}</p>
    {/if}
  </div>
</section>

<style>
  .block {
    position: relative;
    background: var(--block-bg);
    border-radius: 16px;
    padding: 1.75rem;
    margin: 0 auto 2rem;
    max-width: 900px;
    overflow: hidden;
    isolation: isolate;
  }

  .block-content {
    position: relative;
    z-index: 1;
  }

  h2 {
    margin: 0 0 0.3rem;
    color: var(--block-accent);
    font-size: 1.5rem;
  }

  .date-range {
    margin: 0 0 0.5rem;
    color: var(--block-text-secondary);
    font-size: 0.85rem;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin: 0.75rem 0;
  }

  .tag {
    font-size: 0.72rem;
    padding: 0.22rem 0.6rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.12);
    color: var(--block-text-secondary);
    text-transform: capitalize;
  }

  .tag.matched {
    background: rgba(255, 255, 255, 0.34);
    color: var(--block-accent);
    font-weight: 600;
  }

  .description {
    color: var(--block-text-secondary);
    line-height: 1.5;
    max-width: 65ch;
  }

  .image-grid {
    display: grid;
    gap: 0.75rem;
    margin: 1rem 0;
  }

  .image-grid.count-1 {
    grid-template-columns: minmax(0, 480px);
  }

  .image-grid.count-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  .image-grid.count-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 640px) {
    .image-grid.count-2,
    .image-grid.count-3 {
      grid-template-columns: 1fr;
    }
  }

  .image-grid figure {
    margin: 0;
  }

  .image-grid img {
    width: 100%;
    height: auto;
    border-radius: 8px;
  }

  .image-grid figcaption {
    margin-top: 0.3rem;
    font-size: 0.72rem;
    color: var(--block-text-secondary);
    opacity: 0.8;
  }

  .current-work,
  .impact {
    color: var(--block-text-secondary);
    line-height: 1.5;
    max-width: 65ch;
  }

  .current-version {
    color: var(--block-accent);
    margin-bottom: 0.5rem;
  }

  .previous-versions {
    color: var(--page-text-dim);
    font-size: 0.88rem;
  }

  .previous-versions-label {
    margin: 0 0 0.3rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .previous-versions ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .links-row {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
  }

  .inline-link {
    color: var(--block-accent);
    text-decoration: underline;
    text-underline-offset: 2px;
    font-size: 0.88rem;
    margin-left: 0.5rem;
  }

  .links-row .inline-link {
    margin-left: 0;
  }

  .tools-row {
    margin-top: 1.25rem;
    font-size: 0.75rem;
    color: var(--page-text-dim);
  }

  .tools-label {
    font-weight: 600;
    margin-right: 0.3rem;
  }
</style>

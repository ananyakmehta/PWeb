<script>
  // DD_initial_build.md §5.4 — "the single most important interaction in the site per
  // the brief." animate:flip on the keyed {#each}, scale-out for leaving blocks. §3.4's
  // AND-across-groups/OR-within-group filter formula is applied verbatim below.
  import { onMount } from 'svelte';
  import { scale } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import Block from './Block.svelte';

  let { blocks, themes, activeTypeTags, activeTopicTags } = $props();

  let reducedMotion = $state(false);
  onMount(() => {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const filtered = $derived(
    blocks.filter((b) => {
      const typeOk = activeTypeTags.length === 0 || b.typeTags.some((t) => activeTypeTags.includes(t));
      const topicOk = activeTopicTags.length === 0 || b.topicTags.some((t) => activeTopicTags.includes(t));
      return typeOk && topicOk;
    })
  );
</script>

<div class="block-list">
  {#each filtered as block (block.slug)}
    <div
      class="block-wrap"
      animate:flip={{ duration: reducedMotion ? 0 : 350 }}
      in:scale={{ duration: reducedMotion ? 0 : 220, start: 0.9 }}
      out:scale={{ duration: reducedMotion ? 0 : 220, start: 0.9 }}
    >
      <Block {block} theme={themes[block.theme] ?? themes.other} {activeTypeTags} {activeTopicTags} />
    </div>
  {/each}
</div>

<style>
  .block-list {
    padding: 1.5rem;
    max-width: 960px;
    margin: 0 auto;
  }
</style>

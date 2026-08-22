<script>
  // Single island so the filter bar, main feed, and Other section all share one
  // reactive filter-state source — DD_initial_build.md never treats these as separate
  // subsystems (§5.4's FLIP reflow and §7's "only when no filter is active" both key
  // off the same active-tags state).
  import FilterBar from './FilterBar.svelte';
  import BlockList from './BlockList.svelte';
  import OtherSection from './OtherSection.svelte';

  let { mainBlocks, otherBlocks, themes, typeTagMeta, topicTagMeta } = $props();

  let activeTypeTags = $state([]);
  let activeTopicTags = $state([]);

  const noFilterActive = $derived(activeTypeTags.length === 0 && activeTopicTags.length === 0);
</script>

<FilterBar typeTags={typeTagMeta} topicTags={topicTagMeta} bind:activeTypeTags bind:activeTopicTags />

<main class="main-feed">
  <BlockList blocks={mainBlocks} {themes} {activeTypeTags} {activeTopicTags} />
</main>

<OtherSection blocks={otherBlocks} {themes} show={noFilterActive} />

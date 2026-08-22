<script>
  // DD_initial_build.md §7 — appears only in the unfiltered view; excluded from tag
  // filtering entirely (§3.4), so no active-tag props are forwarded to Block here.
  import Block from './Block.svelte';
  import OtherDivider from './OtherDivider.svelte';

  let { blocks, themes, show } = $props();
</script>

{#if show && blocks.length > 0}
  <OtherDivider />
  <div class="other-list">
    {#each blocks as block (block.slug)}
      <Block {block} theme={themes[block.theme] ?? themes.other} activeTypeTags={[]} activeTopicTags={[]} />
    {/each}
  </div>
{/if}

<style>
  .other-list {
    padding: 0 1.5rem 2rem;
    max-width: 960px;
    margin: 0 auto;
  }
</style>

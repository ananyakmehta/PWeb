<script>
  // DD_initial_build.md §5 — two independent multiselect groups (Type, Topic).
  // §5.2 mobile pattern: tap toggles the filter AND reveals the description at the
  // same time (the doc explicitly delegates this choice to Claude Code, picking the
  // simpler standard pattern over a separate "reveal-only" tap state).
  let {
    typeTags,
    topicTags,
    activeTypeTags = $bindable([]),
    activeTopicTags = $bindable([]),
  } = $props();

  let canHover = $state(true);
  let revealedKey = $state(null);

  $effect(() => {
    canHover = window.matchMedia('(hover: hover)').matches;
  });

  function toggle(group, key) {
    if (group === 'type') {
      activeTypeTags = activeTypeTags.includes(key)
        ? activeTypeTags.filter((k) => k !== key)
        : [...activeTypeTags, key];
    } else {
      activeTopicTags = activeTopicTags.includes(key)
        ? activeTopicTags.filter((k) => k !== key)
        : [...activeTopicTags, key];
    }
    if (!canHover) revealedKey = key;
  }

  function handleWindowClick(e) {
    if (canHover) return;
    if (!(e.target instanceof Element) || !e.target.closest('.pill-wrap')) {
      revealedKey = null;
    }
  }
</script>

<svelte:window onclick={handleWindowClick} />

<div class="filter-bar">
  <div class="tag-group">
    <span class="group-label">Type</span>
    <div class="pills">
      {#each typeTags as tag (tag.key)}
        <div
          class="pill-wrap"
          onmouseenter={() => canHover && (revealedKey = tag.key)}
          onmouseleave={() => canHover && (revealedKey = null)}
        >
          <button
            type="button"
            class="pill"
            class:active={activeTypeTags.includes(tag.key)}
            aria-pressed={activeTypeTags.includes(tag.key)}
            onclick={() => toggle('type', tag.key)}
          >
            {tag.label}
          </button>
          {#if revealedKey === tag.key}
            <div class="pill-description" role="tooltip">{tag.description}</div>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <div class="tag-group">
    <span class="group-label">Topic</span>
    <div class="pills">
      {#each topicTags as tag (tag.key)}
        <div
          class="pill-wrap"
          onmouseenter={() => canHover && (revealedKey = tag.key)}
          onmouseleave={() => canHover && (revealedKey = null)}
        >
          <button
            type="button"
            class="pill"
            class:active={activeTopicTags.includes(tag.key)}
            aria-pressed={activeTopicTags.includes(tag.key)}
            onclick={() => toggle('topic', tag.key)}
          >
            {tag.label}
          </button>
          {#if revealedKey === tag.key}
            <div class="pill-description" role="tooltip">{tag.description}</div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .filter-bar {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    padding: 0.9rem 1.5rem;
    margin: 0 auto;
    max-width: 960px;
    background: rgba(11, 11, 16, 0.85);
    backdrop-filter: blur(6px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .tag-group {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .group-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--page-text-dim);
    margin-right: 0.2rem;
  }

  .pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .pill-wrap {
    position: relative;
  }

  .pill {
    font: inherit;
    font-size: 0.82rem;
    border: none;
    cursor: pointer;
    padding: 0.35rem 0.85rem;
    border-radius: 999px;
    background: var(--pill-bg);
    color: var(--pill-text);
    transition: background 150ms ease, color 150ms ease;
  }

  .pill.active {
    background: var(--pill-bg-active);
    color: var(--pill-text-active);
    font-weight: 600;
  }

  .pill-description {
    position: absolute;
    top: calc(100% + 0.4rem);
    left: 0;
    z-index: 6;
    width: max-content;
    max-width: 220px;
    padding: 0.5rem 0.7rem;
    border-radius: 8px;
    background: #1a1a22;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--page-text-dim);
    font-size: 0.78rem;
    line-height: 1.35;
    pointer-events: none;
    animation: fade-in 120ms ease-out;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(-2px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pill-description {
      animation: none;
    }
  }
</style>

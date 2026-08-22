<script>
  // DD_initial_build.md §6.3 — status dot + label. `paused` (amber) is unused by this
  // pass's content but must be a fully working state here.
  let { status } = $props();

  const colorVar = {
    ongoing: 'var(--status-ongoing)',
    completed: 'var(--status-completed)',
    paused: 'var(--status-paused)',
  };

  const labelText = {
    ongoing: 'Ongoing',
    completed: 'Completed',
    paused: 'Paused',
  };
</script>

<span class="status">
  <span class="dot" style={`background:${colorVar[status]};`}></span>
  {labelText[status]}
</span>

<style>
  .status {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.78rem;
    color: var(--page-text-dim);
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
</style>

<!-- DD_initial_build.md §7 — visually distinct divider preceding the "Other" section. -->
<div class="divider" role="separator">
  <span class="line"></span>
  <span class="label">Other</span>
  <span class="line"></span>
</div>

<style>
  .divider {
    display: flex;
    align-items: center;
    gap: 1rem;
    max-width: 960px;
    margin: 3rem auto 1.5rem;
    padding: 0 1.5rem;
  }

  .line {
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.15);
  }

  .label {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--page-text-dim);
  }
</style>

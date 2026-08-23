// Shared state for the "static mode" corner toggle (StaticModeToggle.svelte) and
// the reactive halftone background it controls (ReactiveHalftoneBackground.svelte).
// Persisted in localStorage per direct instruction ("maintains status even when
// the site is refreshed"), and broadcast via a custom window event so the
// background — already mounted and running its own rAF loop — reacts live to a
// toggle flip instead of needing a reload.
const STORAGE_KEY = 'pweb-rainbow-enabled';
const EVENT_NAME = 'pweb:rainbow-enabled-change';

// Rainbow grid is on by default — per direct instruction the switch itself
// "stays on by default", so a visitor who never touches it keeps seeing the
// site's normal reactive background, not a fallback state.
export function getRainbowEnabled(): boolean {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === null ? true : stored === 'true';
}

export function setRainbowEnabled(value: boolean): void {
  window.localStorage.setItem(STORAGE_KEY, String(value));
  window.dispatchEvent(new CustomEvent<boolean>(EVENT_NAME, { detail: value }));
}

export function onRainbowEnabledChange(handler: (value: boolean) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<boolean>).detail);
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

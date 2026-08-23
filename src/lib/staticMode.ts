// Shared state for the "static mode" corner toggle (StaticModeToggle.svelte) and
// the reactive halftone background it controls (ReactiveHalftoneBackground.svelte).
// Persisted in localStorage per direct instruction ("maintains status even when
// the site is refreshed"), and broadcast via a custom window event so the
// background — already mounted and running its own rAF loop — reacts live to a
// toggle flip instead of needing a reload.
//
// The stored/broadcast value is "is static mode ON" directly (true = rainbow grid
// disabled, flat dots only) — per direct instruction the switch's own on/off state
// IS static mode, not its inverse, so this deliberately doesn't store "rainbow
// enabled" and flip it at the call sites.
const STORAGE_KEY = 'pweb-static-mode';
const EVENT_NAME = 'pweb:static-mode-change';

// Off by default — per direct instruction — so a visitor who never touches the
// toggle keeps seeing the site's normal reactive rainbow background.
export function getStaticModeEnabled(): boolean {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === null ? false : stored === 'true';
}

export function setStaticModeEnabled(value: boolean): void {
  window.localStorage.setItem(STORAGE_KEY, String(value));
  window.dispatchEvent(new CustomEvent<boolean>(EVENT_NAME, { detail: value }));
}

export function onStaticModeChange(handler: (value: boolean) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<boolean>).detail);
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

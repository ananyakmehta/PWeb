// astro.config.mjs sets `base: '/PWeb'` for GitHub Pages (username.github.io/PWeb/).
// v1 never needed real internal links (single page, only `#` placeholders), but v2
// introduces real cross-page navigation (index -> /projects/<slug>, nav links) that
// must respect that base path or 404 once deployed — this centralizes the prefixing
// so every internal href goes through the same logic instead of five call sites each
// hand-rolling their own string concatenation.
export function withBase(path: string): string {
  // BASE_URL's trailing slash isn't reliable across configs/versions (observed
  // "/PWeb" without one here, despite astro.config.mjs setting base: '/PWeb') — join
  // explicitly instead of assuming one is there, or paths silently concatenate
  // without a separator (e.g. "/PWebprojects/...").
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${base}/${cleanPath}`;
}

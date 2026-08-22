// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  // GitHub Pages deployment target: https://ananyakmehta.github.io/PWeb/
  // `base` must match the repo name exactly, or built asset paths 404 on Pages.
  site: 'https://ananyakmehta.github.io',
  base: '/PWeb',
  integrations: [svelte()]
});
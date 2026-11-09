// @ts-check
import { defineConfig } from 'astro/config';

// Zero-maintenance setup:
// - The built site goes into /docs and is committed to the repo.
// - GitHub Pages serves /docs directly ("Deploy from a branch"), so no
//   build service, GitHub Action or dependency has to keep working after launch.
export default defineConfig({
  site: 'https://guinoregis-cyber.github.io',
  base: '/buad302-career-toolkit',
  outDir: './docs',
  trailingSlash: 'always',
});

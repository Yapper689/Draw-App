import { defineConfig } from 'astro/config';

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  site: 'https://yapper689.github.io',
  base: 'draw-app',
});
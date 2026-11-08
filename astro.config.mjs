// @ts-check
import { defineConfig } from 'astro/config';
import unlistedDemos from './src/integrations/unlisted-demos.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://drakeworks.github.io',
	integrations: [unlistedDemos()],
});

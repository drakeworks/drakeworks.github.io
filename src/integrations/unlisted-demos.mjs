// @ts-check
// Unlisted demos: every HTML file built under /demos/ gets a noindex meta tag, whatever
// SITE_INDEXABLE says. Raw files dropped in public/demos/ skip BaseLayout, so this is what
// keeps them out of search results once the site goes live. See "Unlisted demos" in CLAUDE.md.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROBOTS_META = '<meta name="robots" content="noindex, nofollow">';

/** @param {string} dir @returns {Promise<string[]>} */
async function htmlFiles(dir) {
	const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
	const nested = await Promise.all(
		entries.map((e) => {
			const path = join(dir, e.name);
			if (e.isDirectory()) return htmlFiles(path);
			return Promise.resolve(e.name.endsWith('.html') ? [path] : []);
		}),
	);
	return nested.flat();
}

/** @returns {import('astro').AstroIntegration} */
export default function unlistedDemos() {
	return {
		name: 'unlisted-demos',
		hooks: {
			'astro:build:done': async ({ dir, logger }) => {
				const files = await htmlFiles(join(fileURLToPath(dir), 'demos'));
				for (const file of files) {
					const html = await readFile(file, 'utf8');
					if (/<meta[^>]+name=["']?robots["']?[^>]*noindex/i.test(html)) continue;
					const head = html.match(/<head[^>]*>/i);
					if (!head) {
						throw new Error(`unlisted-demos: ${file} has no <head>, so noindex can't be added.`);
					}
					const at = (head.index ?? 0) + head[0].length;
					await writeFile(file, html.slice(0, at) + ROBOTS_META + html.slice(at));
				}
				logger.info(`noindex ensured on ${files.length} demo page(s)`);
			},
		},
	};
}

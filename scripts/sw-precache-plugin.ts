import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import type { Compiler } from '@rspack/core';

// every content-hashed asset (all js incl. async route chunks, css, fonts, images) so the whole app
// — not just the routes already visited — is available offline once installed
const PRECACHE_FILE = /\.(?:css|gif|ico|jpe?g|js|png|svg|webp|woff2?)$/;

/**
 * Emits a precaching service worker (`sw.js`) at the build root by injecting the full content-hashed asset
 * manifest into a template. The injected manifest — and the cache name derived from it — changes whenever the
 * built asset set changes, so the emitted worker's bytes change too; that byte change is what makes the
 * browser detect an update and re-run precaching.
 */
export class ServiceWorkerPrecachePlugin {
	readonly #templatePath: string;

	/**
	 * @param templatePath absolute path to the service worker template; its source is prefixed with the
	 *   injected `CACHE` and `PRECACHE` declarations
	 */
	constructor(templatePath: string) {
		this.#templatePath = templatePath;
	}

	apply(compiler: Compiler) {
		const { Compilation, sources } = compiler.rspack;
		compiler.hooks.thisCompilation.tap('ServiceWorkerPrecachePlugin', (compilation) => {
			compilation.hooks.processAssets.tap(
				{
					name: 'ServiceWorkerPrecachePlugin',
					// run once filenames are finalized so the manifest reflects the emitted assets
					stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
				},
				() => {
					const files = new Set(['index.html']);
					for (const asset of compilation.getAssets()) {
						// only assets under static/ carry a content hash; root files (favicon, oauth
						// metadata) are mutable and stay network-driven
						if (asset.name.startsWith('static/') && PRECACHE_FILE.test(asset.name)) {
							files.add(asset.name);
						}
					}
					const manifest = [...files].sort().map((file) => `/${file}`);
					const version = createHash('sha256').update(manifest.join('\n')).digest('hex').slice(0, 16);
					const template = readFileSync(this.#templatePath, 'utf8');
					const source =
						`const CACHE = ${JSON.stringify(`app-${version}`)};\n` +
						`const PRECACHE = ${JSON.stringify(manifest)};\n` +
						template;
					compilation.emitAsset('sw.js', new sources.RawSource(source));
				},
			);
		});
	}
}

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import type { Compiler } from '@rspack/core';

// every content-hashed asset (all js incl. async route chunks, css, fonts, images) so the whole app
// — not just the routes already visited — is available offline once installed
const PRECACHE_FILE = /\.(?:css|gif|ico|jpe?g|js|png|svg|webp|woff2?)$/;

/**
 * emits a precaching service worker (`sw.js`) at the build root by injecting the full content-hashed asset
 * manifest into a template.
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
					const files = new Set<string>();
					for (const asset of compilation.getAssets()) {
						// only assets under static/ carry a content hash; root files (favicon, oauth
						// metadata) are mutable and stay network-driven
						if (asset.name.startsWith('static/') && PRECACHE_FILE.test(asset.name)) {
							files.add(asset.name);
						}
					}
					// precache the SPA shell under the canonical `/`, not `/index.html`: a host may
					// 307-redirect `/index.html` to `/`, and a redirected response can't satisfy a navigation
					const manifest = ['/', ...[...files].sort().map((file) => `/${file}`)];
					// the shell is cached under the mutable `/` (not a content-hashed name), so fold the emitted
					// index.html bytes into the version: a shell-only change must still bump CACHE and the worker
					const indexHtml = compilation.getAsset('index.html')?.source.source() ?? '';
					const version = createHash('sha256')
						.update(manifest.join('\n'))
						.update('\0')
						.update(indexHtml)
						.digest('hex')
						.slice(0, 16);
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

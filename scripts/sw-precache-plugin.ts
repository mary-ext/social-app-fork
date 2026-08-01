import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import type { Compiler } from '@rspack/core';

// precache every content-hashed asset so the whole app is available offline.
const PRECACHE_FILE = /\.(?:css|gif|ico|jpe?g|js|png|svg|webp|woff2?)$/;

/** emits `sw.js` with the content-hashed asset manifest. */
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
					// wait for finalized filenames.
					stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
				},
				() => {
					const files = new Set<string>();
					for (const asset of compilation.getAssets()) {
						// root files are mutable and stay network-driven.
						if (asset.name.startsWith('static/') && PRECACHE_FILE.test(asset.name)) {
							files.add(asset.name);
						}
					}
					// cache the SPA shell under `/`; redirected responses cannot satisfy navigations.
					// oxlint-disable-next-line unicorn/no-array-sort -- sorting our own copy of `files`
					const manifest = ['/', ...[...files].sort().map((file) => `/${file}`)];
					// include shell bytes in the version because `/` is not content-hashed.
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

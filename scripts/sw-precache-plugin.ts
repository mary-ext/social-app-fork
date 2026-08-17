import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { minifySync, type Plugin } from 'vite';

const PRECACHE_EXCLUDE = /\.map$/;

export const serviceWorkerPrecache = (templatePath: string): Plugin => {
	let assetsDir = 'assets';

	return {
		name: 'service-worker-precache',
		apply: 'build',
		configResolved(config) {
			assetsDir = config.build.assetsDir;
		},
		generateBundle: {
			// wait for `vite:build-html` to emit the shell, whose bytes go into the cache version.
			order: 'post',
			handler(_options, bundle) {
				const files = new Set<string>();
				for (const fileName of Object.keys(bundle)) {
					if (fileName.startsWith(`${assetsDir}/`) && !PRECACHE_EXCLUDE.test(fileName)) {
						files.add(fileName);
					}
				}

				// oxlint-disable-next-line unicorn/no-array-sort -- sorting our own copy of `files`
				const manifest = Array.from(files, (file) => `/${file}`).sort();

				const shell = bundle['index.html'];
				const indexHtml = shell?.type === 'asset' ? shell.source.toString() : '';

				const version = createHash('sha256')
					.update(manifest.join('\n'))
					.update('\0')
					.update(indexHtml)
					.digest('hex')
					.slice(0, 16);

				const template = readFileSync(templatePath, 'utf8');
				const source =
					`const ASSETS = ${JSON.stringify(`/${assetsDir}/`)};\n` +
					`const CACHE = ${JSON.stringify(`app-${version}`)};\n` +
					`const PRECACHE = ${JSON.stringify(manifest)};\n` +
					template;

				const minified = minifySync(templatePath, source);

				this.emitFile({ type: 'asset', fileName: 'sw.js', source: minified.code });
			},
		},
	};
};

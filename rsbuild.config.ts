import path from 'node:path';

import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';
import { VanillaExtractPlugin } from '@vanilla-extract/webpack-plugin';

import oauthMetadata from './public/oauth-client-metadata.json' with { type: 'json' };
import { ServiceWorkerPrecachePlugin } from './scripts/sw-precache-plugin';

const root = process.cwd();
const serverHost = '127.0.0.1';
const serverPort = 19006;

export default defineConfig(({ envMode }) => {
	const oauthScope = process.env.PUBLIC_OAUTH_SCOPE || oauthMetadata.scope;
	const oauthRedirectPath = new URL(oauthMetadata.redirect_uris[0]!).pathname;
	const oauthRedirectUri =
		envMode === 'production'
			? process.env.PUBLIC_OAUTH_REDIRECT_URI || oauthMetadata.redirect_uris[0]!
			: `http://${serverHost}:${serverPort}${oauthRedirectPath}`;
	const oauthClientId =
		envMode === 'production'
			? process.env.PUBLIC_OAUTH_CLIENT_ID || oauthMetadata.client_id
			: `http://localhost?redirect_uri=${encodeURIComponent(oauthRedirectUri)}` +
				`&scope=${encodeURIComponent(oauthScope)}`;

	return {
		plugins: [
			// React Compiler runs natively in rspack's builtin swc-loader (no Babel pass). `panicThreshold:
			// 'none'` downlevels the components the compiler declines to optimize from hard build errors to
			// skipped optimizations — the bail-out severity is honoured as of rspack 2.1.0
			// (web-infra-dev/rspack#14517).
			pluginReact({ reactCompiler: { panicThreshold: 'none' } }),
		],
		source: {
			define: {
				'import.meta.env.PUBLIC_GIT_COMMIT_HASH': JSON.stringify(process.env.GIT_COMMIT_HASH ?? ''),
				'import.meta.env.PUBLIC_OAUTH_CLIENT_ID': JSON.stringify(oauthClientId),
				'import.meta.env.PUBLIC_OAUTH_REDIRECT_URI': JSON.stringify(oauthRedirectUri),
				'import.meta.env.PUBLIC_OAUTH_SCOPE': JSON.stringify(oauthScope),
			},
			entry: {
				index: path.resolve(root, 'index.tsx'),
			},
		},
		html: {
			favicon: path.resolve(root, 'assets/favicon.png'),
			template: path.resolve(root, 'web/index.html'),
			title: 'Bluesky',
		},
		resolve: {
			alias: {
				'#': path.resolve(root, 'src'),
				'react-native': 'react-native-web',
			},
			aliasStrategy: 'prefer-alias',
			extensions: [
				'.web.ts',
				'.web.tsx',
				'.web.mjs',
				'.web.js',
				'.web.jsx',
				'.ts',
				'.tsx',
				'.mjs',
				'.js',
				'.jsx',
				'.json',
			],
		},
		server: {
			host: serverHost,
			historyApiFallback: true,
			port: serverPort,
			// forward link-resolution xrpc calls to the locally-running worker (`pnpm dev:worker`), keeping
			// them same-origin from the browser's perspective.
			proxy: {
				'/xrpc': 'http://127.0.0.1:8787',
			},
		},
		output: {
			cleanDistPath: true,
			distPath: { root: 'web-build' },
			sourceMap: { js: 'source-map' },
			minify: {
				jsOptions: {
					minimizerOptions: {
						compress: {
							passes: 3,
						},
					},
				},
			},
		},
		performance: {
			// strip console.* from production bundles (replaces babel-plugin-transform-remove-console)
			removeConsole: envMode === 'production',
		},
		tools: {
			rspack(config) {
				config.plugins ??= [];
				config.plugins.push(new VanillaExtractPlugin());

				// precaching only makes sense against a hashed production build; in dev it would fight
				// the dev server and HMR, so the service worker is emitted for production builds only.
				if (envMode === 'production') {
					config.plugins.push(new ServiceWorkerPrecachePlugin(path.resolve(root, 'src/lib/sw-template.js')));
				}

				// opt-in bundle analysis: `RSDOCTOR=true pnpm build`
				if (process.env.RSDOCTOR) {
					config.plugins.push(
						new RsdoctorRspackPlugin({
							disableClientServer: !process.stdout.isTTY,
							// the loader probe recurses to a stack overflow on vanilla-extract's virtual
							// `extracted.js` modules; we only want bundle/chunk analysis anyway.
							features: { bundle: true, loader: false, plugins: true, resolver: false, treeShaking: false },
						}),
					);
				}
			},
		},
	};
});

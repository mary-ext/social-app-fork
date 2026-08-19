import { execFileSync } from 'node:child_process';
import path from 'node:path';

import svgSprites from '@oomfware/vite-plugin-svg-sprites';

import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig, type Rolldown } from 'vite';

import oauthMetadata from './public/oauth-client-metadata.json' with { type: 'json' };
import { serviceWorkerPrecache } from './scripts/sw-precache-plugin.ts';

const root = process.cwd();
const serverHost = '127.0.0.1';
const serverPort = 19006;

const resolveCommitHash = (): string => {
	const injected = process.env.WORKERS_CI_COMMIT_SHA;
	if (injected) {
		return injected.slice(0, 7);
	}

	try {
		return execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], { encoding: 'utf8' }).trim();
	} catch {
		return '';
	}
};

export default defineConfig(({ mode }) => {
	const isProduction = mode === 'production';

	const oauthScope = process.env.PUBLIC_OAUTH_SCOPE || oauthMetadata.scope;
	const oauthRedirectPath = new URL(oauthMetadata.redirect_uris[0]!).pathname;
	const oauthRedirectUri = isProduction
		? process.env.PUBLIC_OAUTH_REDIRECT_URI || oauthMetadata.redirect_uris[0]!
		: `http://${serverHost}:${serverPort}${oauthRedirectPath}`;
	const oauthClientId = isProduction
		? process.env.PUBLIC_OAUTH_CLIENT_ID || oauthMetadata.client_id
		: `http://localhost?redirect_uri=${encodeURIComponent(oauthRedirectUri)}` +
			`&scope=${encodeURIComponent(oauthScope)}`;

	const minify: Rolldown.MinifyOptions = {
		compress: {
			dropConsole: isProduction,
		},
	};

	const codeSplitting: Rolldown.CodeSplittingOptions = {
		minShareCount: 24,
		groups: [
			// #region eager tier
			// claim the initial graph before mixed groups can pull lazy modules onto the critical path.
			{
				name: 'react',
				tags: ['$initial'],
				test: /node_modules[\\/]@oomfware[\\/]scion[\\/]/,
				minShareCount: 1,
				priority: 100,
			},
			{ name: 'vendor-eager', tags: ['$initial'], test: /node_modules[\\/]/, minShareCount: 1, priority: 95 },
			{ name: 'app-eager', tags: ['$initial'], minShareCount: 1, priority: 90 },
			// #endregion

			// #region lazy tier
			{ name: 'messages', test: /[\\/]src[\\/]paraglide[\\/]/, priority: 20 },
			{ name: 'icons', test: /[\\/]src[\\/]icons[\\/]/, priority: 20 },
			{ name: 'base-ui', test: /node_modules[\\/](?:@base-ui|@floating-ui)[\\/]/, priority: 15 },
			{ name: 'atproto', test: /node_modules[\\/](?:@atcute|@jsr[\\/]mary__)/, priority: 15 },
			{ name: 'common', priority: 0 },
			// #endregion
		],
	};

	return {
		plugins: [
			react({ compiler: { panicThreshold: 'none' } }),
			vanillaExtractPlugin(),
			svgSprites({
				target: 'react19-jsx',
				splitting: 'chunk',
				spriteName: 'sprites',
			}),
			isProduction && serviceWorkerPrecache(path.resolve(root, 'src/lib/sw-template.js')),
		],
		envPrefix: 'PUBLIC_',
		define: {
			'import.meta.env.PUBLIC_GIT_COMMIT_HASH': JSON.stringify(isProduction ? resolveCommitHash() : ''),
			'import.meta.env.PUBLIC_OAUTH_CLIENT_ID': JSON.stringify(oauthClientId),
			'import.meta.env.PUBLIC_OAUTH_REDIRECT_URI': JSON.stringify(oauthRedirectUri),
			'import.meta.env.PUBLIC_OAUTH_SCOPE': JSON.stringify(oauthScope),
		},
		resolve: {
			alias: [
				{ find: /^react$/, replacement: '@oomfware/scion/react' },
				{ find: /^react\/compiler-runtime$/, replacement: '@oomfware/scion/compiler-runtime' },
				{ find: /^react\/jsx-dev-runtime$/, replacement: '@oomfware/scion/jsx-runtime' },
				{ find: /^react\/jsx-runtime$/, replacement: '@oomfware/scion/jsx-runtime' },
				{ find: /^react-dom$/, replacement: '@oomfware/scion/react-dom' },
				{ find: /^react-dom\/client$/, replacement: '@oomfware/scion/react-dom-client' },
				{ find: /^scheduler$/, replacement: '@oomfware/scion/scheduler' },
				{
					find: /^use-sync-external-store\/shim$/,
					replacement: '@oomfware/scion/use-sync-external-store-shim',
				},
				{ find: /^#\//, replacement: `${path.resolve(root, 'src')}/` },
			],
		},
		server: {
			host: serverHost,
			port: serverPort,
			strictPort: true,
			proxy: {
				'/xrpc': 'http://127.0.0.1:8787',
			},
		},
		build: {
			outDir: 'web-build',
			emptyOutDir: true,
			sourcemap: true,
			// prevent content hashes from cascading through importers.
			chunkImportMap: true,
			modulePreload: { polyfill: false },
			rolldownOptions: {
				output: {
					chunkFileNames: 'assets/js/[hash:7].js',
					assetFileNames: 'assets/[ext]/[hash:7][extname]',
					codeSplitting,
					minify,
				},
			},
		},
		worker: {
			format: 'es',
			rolldownOptions: { output: { minify } },
		},
	};
});

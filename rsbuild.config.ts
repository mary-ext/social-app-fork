import { execFileSync } from 'node:child_process';
import path from 'node:path';

import { SvgSpritesPlugin } from '@oomfware/rspack-plugin-svg-sprites';

import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';
import { VanillaExtractPlugin } from '@vanilla-extract/webpack-plugin';

import oauthMetadata from './public/oauth-client-metadata.json' with { type: 'json' };
import { ServiceWorkerPrecachePlugin } from './scripts/sw-precache-plugin';

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
		plugins: [pluginReact({ reactCompiler: { panicThreshold: 'none' } })],
		source: {
			define: {
				'import.meta.env.PUBLIC_GIT_COMMIT_HASH': JSON.stringify(
					envMode === 'production' ? resolveCommitHash() : '',
				),
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
			template: path.resolve(root, 'index.html'),
			title: 'Bluesky',
		},
		resolve: {
			alias: {
				'#': path.resolve(root, 'src'),
				'react/compiler-runtime$': '@oomfware/scion/compiler-runtime',
				'react/jsx-dev-runtime$': '@oomfware/scion/jsx-runtime',
				'react/jsx-runtime$': '@oomfware/scion/jsx-runtime',
				react$: '@oomfware/scion/react',
				'react-dom/client$': '@oomfware/scion/react-dom-client',
				'react-dom$': '@oomfware/scion/react-dom',
				scheduler$: '@oomfware/scion/scheduler',
				'use-sync-external-store/shim$': '@oomfware/scion/use-sync-external-store-shim',
			},
			aliasStrategy: 'prefer-alias',
			extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
		},
		server: {
			host: serverHost,
			historyApiFallback: true,
			port: serverPort,
			proxy: {
				'/xrpc': 'http://127.0.0.1:8787',
			},
		},
		output: {
			cleanDistPath: true,
			distPath: { root: 'web-build' },
			filenameHash: 'contenthash:6',
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
				config.output ??= {};
				config.output.hashDigest = 'base64url';

				config.plugins ??= [];
				config.plugins.push(new VanillaExtractPlugin());

				config.plugins.push(
					new SvgSpritesPlugin({
						target: 'react19-jsx',
						splitting: 'chunk',
						spriteFilename: 'static/svg/sprites.[contenthash:6].svg',
					}),
				);

				config.optimization ??= {};
				if (config.optimization.splitChunks !== false) {
					config.optimization.splitChunks ??= {};

					// hoist CSS shared by two or more chunks.
					config.optimization.splitChunks.cacheGroups ??= {};
					config.optimization.splitChunks.cacheGroups.sharedStyles = {
						chunks: 'all',
						minChunks: 2,
						minSize: 0,
						priority: 20,
						reuseExistingChunk: true,
						type: 'css/mini-extract',
					};
				}

				// emit the service worker only for production builds.
				if (envMode === 'production') {
					config.plugins.push(new ServiceWorkerPrecachePlugin(path.resolve(root, 'src/lib/sw-template.js')));
				}

				// opt-in bundle analysis: `RSDOCTOR=true pnpm build`
				if (process.env.RSDOCTOR) {
					config.plugins.push(
						new RsdoctorRspackPlugin({
							disableClientServer: !process.stdout.isTTY,
							// the loader probe overflows on vanilla-extract virtual modules.
							features: { bundle: true, loader: false, plugins: true, resolver: false, treeShaking: false },
						}),
					);
				}
			},
		},
	};
});

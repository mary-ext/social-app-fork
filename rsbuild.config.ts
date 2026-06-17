import path from 'node:path';

import { defineConfig } from '@rsbuild/core';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginReact } from '@rsbuild/plugin-react';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';
import { VanillaExtractPlugin } from '@vanilla-extract/webpack-plugin';

import oauthMetadata from './public/oauth-client-metadata.json' with { type: 'json' };

const root = process.cwd();
const serverHost = '127.0.0.1';
const serverPort = 19006;

const transpiledPaths = [
	path.resolve(root, 'index.tsx'),
	path.resolve(root, 'node_modules/react-native'),
	path.resolve(root, 'node_modules/react-native-edge-to-edge'),
	path.resolve(root, 'node_modules/react-native-progress'),
	path.resolve(root, 'node_modules/react-native-safe-area-context'),
	path.resolve(root, 'node_modules/react-native-svg'),
	path.resolve(root, 'src'),
];

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
			pluginReact(),
			pluginBabel({
				// vanilla-extract `.css.ts` files are build-evaluated by VanillaExtractPlugin, not runtime
				// code — keep them out of the babel pipeline (notably react-compiler) entirely.
				exclude: /\.css\.ts$/,
				include: transpiledPaths,
				babelLoaderOptions(options, { addPlugins }) {
					options.presets = [];
					options.overrides = [
						{
							plugins: ['@babel/plugin-syntax-jsx'],
							test: /node_modules[/\\]react-native-progress[/\\].*\.jsx?$/,
						},
						{
							plugins: [
								[
									'@babel/plugin-transform-typescript',
									{
										allowNamespaces: true,
										isTSX: false,
									},
								],
							],
							test: /\.[cm]?ts$/,
						},
						{
							plugins: [
								[
									'@babel/plugin-transform-typescript',
									{
										allowNamespaces: true,
										isTSX: true,
									},
								],
							],
							test: /\.[cm]?tsx$/,
						},
					];
					addPlugins([
						'@lingui/babel-plugin-lingui-macro',
						['babel-plugin-react-compiler', { target: '19' }],
						...(envMode === 'production' ? ['transform-remove-console'] : []),
					]);
				},
			}),
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
			include: transpiledPaths,
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
			conditionNames: ['browser', 'import', 'module', 'default'],
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
		},
		tools: {
			rspack(config) {
				config.plugins ??= [];
				config.plugins.push(new VanillaExtractPlugin());

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

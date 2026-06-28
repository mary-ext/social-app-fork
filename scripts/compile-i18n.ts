import { readFile, writeFile } from 'node:fs/promises';

import { compile } from '@inlang/paraglide-js';

const outdir = './src/paraglide';

await compile({
	outdir,
	project: './project.inlang',
	strategy: [],
	urlPatterns: [],
});

await trimRuntime(`${outdir}/runtime.js`);

/**
 * Strips paraglide's locale-resolution engine out of the generated `runtime.js`.
 *
 * Paraglide ships `getLocale` backed by a full engine — ordered strategy chains, cookie/URL/navigator
 * extraction, a page-reloading `setLocale`, URL (de)localization, custom strategies. This fork is
 * single-locale and resolves its UI language out of band (it reads device storage once at startup and reloads
 * on change — see src/locale/intl/locale.ts), so every compiled message calls `getLocale()` only for a value
 * it immediately discards. Left intact, that one call transitively drags the whole engine into the bundle. We
 * replace the runtime's executable body with the handful of exports the app and the compiled messages
 * actually import, while keeping paraglide's generated type definitions verbatim so they track the installed
 * version instead of drifting against a hand-maintained copy.
 *
 * @param path the generated runtime module to rewrite in place
 * @throws if the runtime is no longer single-locale, or its generated layout no longer matches what this trim
 *   assumes — either means the assumptions here need revisiting rather than silently shipping a broken
 *   runtime
 */
async function trimRuntime(path: string) {
	const source = await readFile(path, 'utf8');

	const baseLocale = source.match(/^export const baseLocale = .+;$/m)?.[0];
	const locales = source.match(/^export const locales = .+;$/m)?.[0];
	const typesIndex = source.indexOf('// ------ TYPES ------');
	if (!baseLocale || !locales || typesIndex === -1) {
		throw new Error(`paraglide runtime layout changed; cannot trim ${path}`);
	}

	const localeCount = locales.match(/"[^"]*"/g)?.length ?? 0;
	if (localeCount !== 1) {
		throw new Error(
			`runtime declares ${localeCount} locales; the single-locale trim in ${path} no longer applies`,
		);
	}

	const trimmed = `/* eslint-disable */

${baseLocale}
${locales}

/** @type {Locale | undefined} */
export const experimentalStaticLocale = undefined;

/**
 * Returns the active locale.
 *
 * Compiled messages call this for a value they discard (the fork is single-locale), so the default
 * only has to not throw. The entry point points it at the real UI language out of band via
 * {@link overwriteGetLocale} (see index.tsx and src/locale/intl/locale.ts); the strategy-resolution
 * engine this replaces would otherwise be pulled into the bundle for nothing.
 *
 * @returns {Locale}
 */
export let getLocale = () => baseLocale;

/**
 * Overrides {@link getLocale}.
 *
 * @param fn the replacement implementation
 */
export const overwriteGetLocale = (fn) => {
	getLocale = fn;
};

${source.slice(typesIndex)}`;

	await writeFile(path, trimmed);
}

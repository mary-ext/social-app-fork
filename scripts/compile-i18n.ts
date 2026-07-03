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
 * strips paraglide's locale-resolution engine out of the generated `runtime.js` to reduce bundle size.
 *
 * @param path path to the generated runtime module to rewrite in place
 * @throws if the runtime structure does not match expectations, indicating the rewrite assumptions need
 *   updating
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
 * returns the active locale.
 *
 * @returns the active locale.
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

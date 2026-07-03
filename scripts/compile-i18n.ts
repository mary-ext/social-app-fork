import { copyFile, mkdir, readdir, readFile, rename, rm, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { compile } from '@inlang/paraglide-js';

const outdir = './src/paraglide';
const tmpOutdir = './node_modules/.tmp/paraglide';

await rm(tmpOutdir, { recursive: true, force: true });

await compile({
	outdir: tmpOutdir,
	project: './project.inlang',
	strategy: [],
	urlPatterns: [],
});

await trimRuntime(`${tmpOutdir}/runtime.js`);

await syncDir(tmpOutdir, outdir);
await rm(tmpOutdir, { recursive: true, force: true });

/**
 * recursively updates destination directory with source directory's contents, keeping the destination
 * directory inode intact.
 *
 * @param src source directory path
 * @param dest destination directory path
 */
async function syncDir(src: string, dest: string) {
	await mkdir(dest, { recursive: true });

	const srcEntries = await readdir(src, { withFileTypes: true });
	const destEntries = await readdir(dest, { withFileTypes: true });

	const destEntryNames = new Set(destEntries.map((e) => e.name));

	for (const entry of srcEntries) {
		const srcPath = join(src, entry.name);
		const destPath = join(dest, entry.name);

		if (entry.isDirectory()) {
			await syncDir(srcPath, destPath);
		} else {
			// rename files atomically to avoid race conditions in the file watcher
			try {
				await rename(srcPath, destPath);
			} catch (e) {
				// fallback for cross-device links (e.g. Docker volumes/mounts)
				if (e && typeof e === 'object' && 'code' in e && e.code === 'EXDEV') {
					await copyFile(srcPath, destPath);
					await unlink(srcPath);
				} else {
					throw e;
				}
			}
		}
		destEntryNames.delete(entry.name);
	}

	for (const name of destEntryNames) {
		const destPath = join(dest, name);
		await rm(destPath, { recursive: true, force: true });
	}
}

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

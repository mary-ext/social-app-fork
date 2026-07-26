import { definite } from '@mary/array-fns';

import { deviceLanguageCodes } from '#/locale/deviceLocales';

import { device, useStorageValue } from '#/storage';

// cap for the composer's post language history.
const HISTORY_LIMIT = 6;

const defaultContentLanguages = deviceLanguageCodes;
const defaultLanguage = deviceLanguageCodes[0] || 'en';
const defaultPostLanguageHistory = deviceLanguageCodes
	.concat(['en', 'ja', 'pt', 'de'])
	.slice(0, HISTORY_LIMIT);

/**
 * returns the languages the user can read.
 *
 * @returns array of BCP-47 language codes
 */
export function useContentLanguages() {
	return useStorageValue(device, ['contentLanguages']) ?? defaultContentLanguages;
}

/**
 * returns the language(s) the user is posting in.
 *
 * @returns comma-separated BCP-47 language codes
 */
export function usePostLanguage() {
	return useStorageValue(device, ['postLanguage']) ?? defaultLanguage;
}

/**
 * returns previously used post languages, most recent first.
 *
 * @returns array of comma-separated BCP-47 language codes
 */
export function usePostLanguageHistory() {
	return useStorageValue(device, ['postLanguageHistory']) ?? defaultPostLanguageHistory;
}

/**
 * returns the language posts are translated into.
 *
 * @returns BCP-47 language code
 */
export function usePrimaryLanguage() {
	return useStorageValue(device, ['primaryLanguage']) ?? defaultLanguage;
}

/** saves the current post language to history. */
export function savePostLanguageToHistory() {
	const postLanguage = device.get(['postLanguage']) ?? defaultLanguage;
	const history = device.get(['postLanguageHistory']) ?? defaultPostLanguageHistory;

	device.set(
		['postLanguageHistory'],
		// filter out duplicate `postLanguage` if it exists, and prepend it to the start of the array
		[postLanguage].concat(history.filter((langs) => langs !== postLanguage)).slice(0, HISTORY_LIMIT),
	);
}

/**
 * sets the languages the user can read.
 *
 * @param code2s BCP-47 language codes
 */
export function setContentLanguages(code2s: string[]) {
	device.set(['contentLanguages'], code2s);
}

/**
 * sets the language(s) the user is posting in.
 *
 * @param commaSeparatedLangCodes comma-separated BCP-47 language codes
 */
export function setPostLanguage(commaSeparatedLangCodes: string) {
	// canonicalize the code order so set-equal selections (e.g. "en,ja" vs "ja,en") dedupe in history
	// and compare consistently everywhere downstream
	// oxlint-disable-next-line unicorn/no-array-sort -- sorting the array `toPostLanguages` just returned
	const postLanguage = toPostLanguages(commaSeparatedLangCodes).sort().join(',');
	device.set(['postLanguage'], postLanguage);
}

/**
 * sets the language posts are translated into.
 *
 * @param code2 BCP-47 language code
 */
export function setPrimaryLanguage(code2: string) {
	device.set(['primaryLanguage'], code2);
}

/**
 * returns the languages the user can read outside React.
 *
 * @returns array of BCP-47 language codes
 */
export function getContentLanguages() {
	return device.get(['contentLanguages']) ?? defaultContentLanguages;
}

/**
 * splits a stored post language string into individual language codes.
 *
 * @param postLanguage comma-separated BCP-47 language codes
 * @returns array of language codes
 */
export function toPostLanguages(postLanguage: string): string[] {
	return definite(postLanguage.split(','));
}

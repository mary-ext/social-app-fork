import { definite, difference, unique } from '@mary-ext/array-fns';

import { deviceLanguageCodes } from '#/locale/deviceLocales';

import { device, useStorageValue } from '#/storage';

// cap for the composer's post language history.
const HISTORY_LIMIT = 6;

const defaultContentLanguages: string[] = [];
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
 * returns previously used post languages, most recent first.
 *
 * @returns array of comma-separated BCP-47 language codes
 */
export function usePostLanguageHistory() {
	return useStorageValue(device, ['postLanguageHistory']) ?? defaultPostLanguageHistory;
}

/**
 * returns the default language for new posts and translations.
 *
 * @returns BCP-47 language code
 */
export function usePrimaryLanguage() {
	return useStorageValue(device, ['primaryLanguage']) ?? defaultLanguage;
}

/**
 * prepends nonempty published language selections to history.
 *
 * @param postLanguages each published post's BCP-47 language codes, in thread order
 */
export function savePublishedPostLanguages(postLanguages: readonly (readonly string[])[]) {
	const used = unique(
		postLanguages.filter((langs) => langs.length !== 0).map((langs) => joinPostLanguages(langs)),
	);
	if (used.length === 0) {
		return;
	}

	const history = device.get(['postLanguageHistory']) ?? defaultPostLanguageHistory;
	device.set(['postLanguageHistory'], used.concat(difference(history, used)).slice(0, HISTORY_LIMIT));
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

/**
 * joins post language codes in sorted order for consistent comparisons.
 *
 * @param languages BCP-47 language codes
 * @returns comma-separated BCP-47 language codes
 */
export function joinPostLanguages(languages: readonly string[]): string {
	return languages.toSorted().join(',');
}

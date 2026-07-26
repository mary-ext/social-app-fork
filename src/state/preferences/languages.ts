import { definite } from '@mary/array-fns';

import { deviceLanguageCodes } from '#/locale/deviceLocales';

import { device, type LanguagePrefs, useStorageValue } from '#/storage';

// cap for the composer's post language history.
const HISTORY_LIMIT = 6;

const defaults: LanguagePrefs = {
	contentLanguages: deviceLanguageCodes,
	postLanguage: deviceLanguageCodes[0] || 'en',
	postLanguageHistory: deviceLanguageCodes.concat(['en', 'ja', 'pt', 'de']).slice(0, HISTORY_LIMIT),
	primaryLanguage: deviceLanguageCodes[0] || 'en',
};

const read = (): LanguagePrefs => device.get(['languagePrefs']) ?? defaults;

/**
 * returns persisted language preferences, falling back to device locales.
 *
 * @returns current language preferences
 */
export function useLanguagePrefs() {
	return useStorageValue(device, ['languagePrefs']) ?? defaults;
}

/** saves the current post language to history. */
export function savePostLanguageToHistory() {
	const prefs = read();
	device.set(['languagePrefs'], {
		...prefs,
		// filter out duplicate `postLanguage` if it exists, and prepend it to the start of the array
		postLanguageHistory: [prefs.postLanguage]
			.concat(prefs.postLanguageHistory.filter((langs) => langs !== prefs.postLanguage))
			.slice(0, HISTORY_LIMIT),
	});
}

/**
 * sets the languages the user can read.
 *
 * @param code2s BCP-47 language codes
 */
export function setContentLanguages(code2s: string[]) {
	device.set(['languagePrefs'], { ...read(), contentLanguages: code2s });
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
	device.set(['languagePrefs'], { ...read(), postLanguage });
}

/**
 * sets the language posts are translated into.
 *
 * @param code2 BCP-47 language code
 */
export function setPrimaryLanguage(code2: string) {
	device.set(['languagePrefs'], { ...read(), primaryLanguage: code2 });
}

/**
 * returns the languages the user can read outside React.
 *
 * @returns array of BCP-47 language codes
 */
export function getContentLanguages() {
	return read().contentLanguages;
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

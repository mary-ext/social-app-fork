import { definite } from '@mary/array-fns';

import { deviceLanguageCodes } from '#/locale/deviceLocales';

import { device, type LanguagePrefs, useStorage } from '#/storage';

const defaults: LanguagePrefs = {
	contentLanguages: deviceLanguageCodes,
	postLanguage: deviceLanguageCodes[0] || 'en',
	postLanguageHistory: deviceLanguageCodes.concat(['en', 'ja', 'pt', 'de']).slice(0, 6),
	primaryLanguage: deviceLanguageCodes[0] || 'en',
};

const read = (): LanguagePrefs => device.get(['languagePrefs']) ?? defaults;

export function useLanguagePrefs() {
	const [languagePrefs = defaults] = useStorage(device, ['languagePrefs']);

	return languagePrefs;
}

export function useLanguagePrefsApi() {
	return {
		setContentLanguages(code2s: string[]) {
			device.set(['languagePrefs'], { ...read(), contentLanguages: code2s });
		},
		setPrimaryLanguage(code2: string) {
			device.set(['languagePrefs'], { ...read(), primaryLanguage: code2 });
		},
		setPostLanguage(commaSeparatedLangCodes: string) {
			// canonicalize the code order so set-equal selections (e.g. "en,ja" vs "ja,en") dedupe in history
			// and compare consistently everywhere downstream
			// oxlint-disable-next-line unicorn/no-array-sort -- sorting the array `toPostLanguages` just returned
			const postLanguage = toPostLanguages(commaSeparatedLangCodes).sort().join(',');
			device.set(['languagePrefs'], { ...read(), postLanguage });
		},
		/**
		 * Saves whatever language codes are currently selected into a history array, which is then used to
		 * populate the language selector menu.
		 */
		savePostLanguageToHistory() {
			const prefs = read();
			device.set(['languagePrefs'], {
				...prefs,
				// filter out duplicate `postLanguage` if it exists, and prepend it to the start of the array
				postLanguageHistory: [prefs.postLanguage]
					.concat(prefs.postLanguageHistory.filter((langs) => langs !== prefs.postLanguage))
					.slice(0, 6),
			});
		},
	};
}

export function getContentLanguages() {
	return read().contentLanguages;
}

export function toPostLanguages(postLanguage: string): string[] {
	return definite(postLanguage.split(','));
}

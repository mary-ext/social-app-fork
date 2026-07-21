import { mapDefined, unique } from '@mary/array-fns';

export type Locale = {
	languageCode: string;
	regionCode: string | null;
};

function getLocales(): Locale[] {
	const locales = mapDefined(navigator.languages, (lang): Locale | undefined => {
		try {
			const parsed = new Intl.Locale(lang);

			return {
				languageCode: parsed.language,
				regionCode: parsed.region ?? null,
			};
		} catch {}
	});

	if (locales.length === 0) {
		return [{ languageCode: 'en', regionCode: null }];
	}

	return locales;
}

/** The device's preferred locales in priority order, derived from `navigator.languages`. */
export const deviceLocales = getLocales();

/**
 * BCP-47 language codes without region for the device's preferred locales, e.g. an array of 2-char language
 * codes.
 */
export const deviceLanguageCodes = unique(deviceLocales.map((l) => l.languageCode));

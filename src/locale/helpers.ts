import type { AppBskyFeedDefs } from '@atcute/bluesky';

import { getPostRecord } from '#/lib/api/record-casts';

import { LOCALE } from './intl/locale';
import { type Language, LANGUAGES_MAP, langCode } from './languages';

const DISPLAY_NAMES_OPTIONS: Intl.DisplayNamesOptions = {
	type: 'language',
	fallback: 'none',
	languageDisplay: 'standard',
};

const localeDisplayNames = new Intl.DisplayNames([LOCALE], DISPLAY_NAMES_OPTIONS);
const englishDisplayNames =
	LOCALE === 'en' ? localeDisplayNames : new Intl.DisplayNames(['en'], DISPLAY_NAMES_OPTIONS);

function getLocalizedLanguage(code: string, appLang: string): string | undefined {
	const displayNames = appLang === 'en' ? englishDisplayNames : localeDisplayNames;

	return displayNames.of(code);
}

export function resolveLanguageName(language: Language, appLang: string): string | undefined {
	const code = langCode(language);
	// localize to the app language, falling back to the English name
	return getLocalizedLanguage(code, appLang) ?? getLocalizedLanguage(code, 'en');
}

export function languageName(language: Language, appLang: string): string {
	return resolveLanguageName(language, appLang) ?? langCode(language);
}

export function codeToLanguageName(lang2or3: string, appLang: string): string {
	const knownLanguage = LANGUAGES_MAP[lang2or3];
	return knownLanguage ? languageName(knownLanguage, appLang) : lang2or3;
}

/**
 * tests whether a BCP-47 language `tag` matches any of the given `ranges` under RFC 4647 Basic Filtering: a
 * range matches when it is `*`, equals the tag, or is a subtag-boundary prefix of it (e.g. `en` matches
 * `en-US`), case-insensitively.
 *
 * @param tag the language tag to test
 * @param ranges one or more language ranges to test against
 * @returns whether the tag matches any range
 */
export function matchesLanguage(tag: string, ranges: string | string[]): boolean {
	const lowerTag = tag.toLowerCase();
	const rangeList = typeof ranges === 'string' ? [ranges] : ranges;
	return rangeList.some((r) => {
		const range = r.toLowerCase();
		return range === '*' || lowerTag === range || lowerTag.startsWith(range + '-');
	});
}

export function isPostInLanguage(post: AppBskyFeedDefs.PostView, targetLangs: string[]): boolean {
	const record = getPostRecord(post);
	if (record.langs?.some((lang) => matchesLanguage(lang, targetLangs))) {
		return true;
	}

	// keep textless posts regardless of language tags.
	return record.text.trim().length === 0;
}

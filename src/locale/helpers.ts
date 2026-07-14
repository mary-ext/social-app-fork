import type { AppBskyFeedDefs, AppBskyFeedPost } from '@atcute/bluesky';

import { detectLanguages } from '#/lib/language-detection';

import { LOCALE } from './intl/locale';
import { type Language, LANGUAGES_MAP, langCode } from './languages';

/**
 * minimum top-candidate probability for a from-text detection to count. below this, the post's language is
 * treated as undetermined.
 */
const DETECTION_FLOOR = 0.2;

export function code3ToCode2(lang: string): string {
	if (lang.length === 3) {
		return LANGUAGES_MAP[lang]?.code2 ?? lang;
	}
	return lang;
}

const DISPLAY_NAMES_OPTIONS: Intl.DisplayNamesOptions = {
	fallback: 'none',
	languageDisplay: 'standard',
	type: 'language',
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

export function getPostLanguageTags(post: AppBskyFeedDefs.PostView) {
	const langs = (post.record as AppBskyFeedPost.Main).langs;
	return Array.isArray(langs) ? langs : [];
}

export function languageName(language: Language, appLang: string): string {
	return resolveLanguageName(language, appLang) ?? langCode(language);
}

export function codeToLanguageName(lang2or3: string, appLang: string): string {
	const knownLanguage = LANGUAGES_MAP[lang2or3];
	return knownLanguage ? languageName(knownLanguage, appLang) : lang2or3;
}

export function getPostLanguage(post: AppBskyFeedDefs.PostView): string | undefined {
	const candidates: string[] = getPostLanguageTags(post);
	let postText: string = '';
	const recordText = (post.record as AppBskyFeedPost.Main).text;
	if (typeof recordText === 'string') {
		postText = recordText;
	}

	// if there's only one declared language, use that
	if (candidates.length === 1) {
		return candidates[0];
	}

	// no text? can't determine
	if (postText.trim().length === 0) {
		return undefined;
	}

	// run the language model
	const detections = detectLanguages(postText);

	// with declared languages, trust the author and just pick whichever they declared scores highest —
	// no confidence floor, since the set is already constrained to what they said the post is in
	if (candidates.length) {
		const match = detections.find(([lang]) => candidates.includes(code3ToCode2(lang)));
		return match ? code3ToCode2(match[0]) : undefined;
	}

	// detecting from text alone: the model emits a deliberately flat softmax, so low-signal text (emoji,
	// numbers, code, keysmash) still yields an argmax — just a near-floor one. gate on it so such posts read
	// as "undetermined" rather than getting a confident-but-meaningless language
	const top = detections[0];
	if (top && top[1] >= DETECTION_FLOOR) {
		return code3ToCode2(top[0]);
	}
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
	const lang = getPostLanguage(post);
	if (!lang) {
		// the post has no text, so we just say "yes" for now
		return true;
	}
	return matchesLanguage(lang, targetLangs);
}

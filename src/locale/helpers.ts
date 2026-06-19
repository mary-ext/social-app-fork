import type { AppBskyFeedDefs, AppBskyFeedPost } from '@atcute/bluesky';
import * as bcp47Match from 'bcp-47-match';

import { detectLanguages } from '#/lib/language-detection';

import { AppLanguage, type Language, LANGUAGES_MAP_CODE2, LANGUAGES_MAP_CODE3 } from './languages';

export function code3ToCode2(lang: string): string {
	if (lang.length === 3) {
		return LANGUAGES_MAP_CODE3[lang]?.code2 || lang;
	}
	return lang;
}

const displayNamesCache = new Map<string, Intl.DisplayNames>();

function getDisplayNames(appLang: string): Intl.DisplayNames {
	let cached = displayNamesCache.get(appLang);
	if (!cached) {
		cached = new Intl.DisplayNames([appLang], {
			type: 'language',
			fallback: 'none',
			languageDisplay: 'standard',
		});
		displayNamesCache.set(appLang, cached);
	}
	return cached;
}

function getLocalizedLanguage(langCode: string, appLang: string): string | undefined {
	try {
		return getDisplayNames(appLang).of(langCode) || undefined;
	} catch (e) {
		// ignore RangeError from Intl.DisplayNames APIs
		if (!(e instanceof RangeError)) {
			throw e;
		}
	}
}

export function getPostLanguageTags(post: AppBskyFeedDefs.PostView) {
	const langs = (post.record as AppBskyFeedPost.Main).langs;
	return Array.isArray(langs) ? langs : [];
}

export function languageName(language: Language, appLang: string): string {
	// if Intl.DisplayNames is unavailable on the target, display the English name
	if (!Intl.DisplayNames) {
		return language.name;
	}

	return getLocalizedLanguage(language.code2, appLang) || language.name;
}

export function codeToLanguageName(lang2or3: string, appLang: string): string {
	const code2 = code3ToCode2(lang2or3);
	const knownLanguage = LANGUAGES_MAP_CODE2[code2];

	return knownLanguage ? languageName(knownLanguage, appLang) : code2;
}

export function getPostLanguage(post: AppBskyFeedDefs.PostView): string | undefined {
	let candidates: string[] = getPostLanguageTags(post);
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
	let langsProbabilityMap = detectLanguages(postText);

	// filter down using declared languages
	if (candidates.length) {
		langsProbabilityMap = langsProbabilityMap.filter(([lang]) => candidates.includes(code3ToCode2(lang)));
	}

	if (langsProbabilityMap[0]) {
		return code3ToCode2(langsProbabilityMap[0][0]);
	}
}

export function isPostInLanguage(post: AppBskyFeedDefs.PostView, targetLangs: string[]): boolean {
	const lang = getPostLanguage(post);
	if (!lang) {
		// the post has no text, so we just say "yes" for now
		return true;
	}
	return bcp47Match.basicFilter(lang, targetLangs).length > 0;
}

export function getTranslatorLink(text: string, targetLangCode: string, sourceLanguage?: string): string {
	return `https://translate.google.com/?sl=${sourceLanguage ?? 'auto'}&tl=${targetLangCode}&text=${encodeURIComponent(
		text,
	)}`;
}

/**
 * Returns a valid `appLanguage` value from an arbitrary string.
 *
 * UI localization is English-only in this fork, so any stale or legacy stored value is normalized back to
 * English.
 */
export function sanitizeAppLanguageSetting(appLanguage: string): AppLanguage {
	void appLanguage;
	return AppLanguage.en;
}

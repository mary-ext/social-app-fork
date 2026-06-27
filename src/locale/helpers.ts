import type { AppBskyFeedDefs, AppBskyFeedPost } from '@atcute/bluesky';
import * as bcp47Match from 'bcp-47-match';

import { detectLanguages } from '#/lib/language-detection';

import { type Language, LANGUAGES_MAP_CODE2, LANGUAGES_MAP_CODE3 } from './languages';

/**
 * Minimum top-candidate probability for a from-text detection to count. Below this the detector is just
 * picking the tallest blade of grass in low-signal noise, so we treat the post's language as undetermined.
 */
const DETECTION_FLOOR = 0.2;

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

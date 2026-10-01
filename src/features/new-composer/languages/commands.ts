import type { Wordgard } from 'wordgard/editor';
import { GardState, Transaction } from 'wordgard/state';

import { joinPostLanguages } from '#/state/preferences/languages';

import { findPostById, getPosts } from '../editor/schema';

type LanguageMap = ReadonlyMap<string, string>;

const emptyLanguageMap: LanguageMap = new Map<string, string>();

const setLanguageEffect = Transaction.Effect.define<{ postId: string; language: string }>();

// new posts copy their predecessor's override to keep the thread's language consistent.
// retain deleted posts' entries so undo restores their languages.
const inheritLanguages = (map: LanguageMap, tr: Transaction): LanguageMap => {
	if (map.size === 0) {
		return map;
	}

	let next: Map<string, string> | null = null;
	let previous: string | undefined;
	for (const { id } of getPosts(tr.newDoc)) {
		const current = next ?? map;
		// wait for normalizePostIds to assign ids before inheriting languages.
		const isNew = id !== '' && findPostById(tr.startState.doc, id) === null;
		if (isNew && previous !== undefined && !current.has(id)) {
			next ??= new Map(map);
			next.set(id, previous);
		}
		previous = (next ?? map).get(id);
	}

	return next ?? map;
};

/** per-post language overrides, stored outside the document and undo history. */
export const languageField = GardState.Field.define<LanguageMap>({
	create() {
		return emptyLanguageMap;
	},
	update(map, tr) {
		let next = tr.docChanged ? inheritLanguages(map, tr) : map;
		for (const fx of tr.effects) {
			if (!fx.is(setLanguageEffect)) {
				continue;
			}

			const { postId, language } = fx.value;
			if (language === '') {
				if (next.has(postId)) {
					const cleared = new Map(next);
					cleared.delete(postId);
					next = cleared;
				}
			} else if (next.get(postId) !== language) {
				next = new Map(next).set(postId, language);
			}
		}
		return next;
	},
});

/**
 * reads a post's language override, or the fallback.
 *
 * @param state the editor state
 * @param postId the post's id
 * @param fallback comma-separated BCP-47 codes used when no override is set
 * @returns comma-separated BCP-47 language codes
 */
export const getPostLanguage = (state: GardState, postId: string, fallback: string): string => {
	return state.field(languageField).get(postId) ?? fallback;
};

/**
 * sets a post's languages; new posts inherit their predecessor's selection.
 *
 * @param wg the editor
 * @param postId the post's id
 * @param languages BCP-47 codes; an empty list restores the composer's default
 */
export const setPostLanguage = (wg: Wordgard, postId: string, languages: readonly string[]): void => {
	wg.dispatch({ effects: setLanguageEffect.of({ postId, language: joinPostLanguages(languages) }) });
};

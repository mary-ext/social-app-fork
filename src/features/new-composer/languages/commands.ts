import type { Wordgard } from 'wordgard/editor';
import type { GardState, Transaction } from 'wordgard/state';

import { joinPostLanguages } from '#/state/preferences/languages';

import { findPostById, getPosts } from '../model/schema';
import { defineTaint, type TaintMap } from '../model/taints';

// new posts copy their predecessor's override to keep the thread's language consistent.
// retain deleted posts' entries so undo restores their languages.
const inheritLanguages = (map: TaintMap<string>, tr: Transaction): TaintMap<string> => {
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

/** comma-separated BCP-47 language overrides, keyed by post id. */
export const languageTaint = defineTaint<string>({
	isEmpty: (language) => language === '',
	isSame: (a, b) => a === b,
	onDocChange: inheritLanguages,
});

/**
 * reads a post's language override.
 *
 * @param state the editor state
 * @param postId the post's id
 * @returns comma-separated BCP-47 codes, or undefined to use the composer's default
 */
export const getPostLanguage = (state: GardState, postId: string): string | undefined => {
	return state.field(languageTaint.field).get(postId);
};

/**
 * sets a post's languages; new posts inherit their predecessor's selection.
 *
 * @param wg the editor
 * @param postId the post's id
 * @param languages BCP-47 codes; an empty list restores the composer's default
 */
export const setPostLanguage = (wg: Wordgard, postId: string, languages: readonly string[]): void => {
	languageTaint.set(wg, [postId], joinPostLanguages(languages));
};

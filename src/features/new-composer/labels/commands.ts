import type { Plot } from 'wordgard/doc';
import type { Wordgard } from 'wordgard/editor';
import type { GardState } from 'wordgard/state';

import { isSameSelfLabels, normalizeSelfLabels, type SelfLabel } from '#/lib/moderation/self-labels';

import { getPostInfo } from '../editor/post-info';
import { getPostParam } from '../editor/schema';
import { defineTaint } from '../editor/taints';

/** content warnings per attachment key. */
export const labelTaint = defineTaint<readonly SelfLabel[]>({
	isEmpty: (labels) => labels.length === 0,
	isSame: isSameSelfLabels,
});

/**
 * lists a post's labelable attachment keys.
 *
 * @param state the editor state
 * @param node the post plot
 * @returns keys for the post's media and external link card, excluding record embeds
 */
export const getAttachmentKeys = (state: GardState, node: Plot): string[] => {
	const keys = getPostParam(node).media.map((item) => `media:${item.id}`);
	const { external } = getPostInfo(state, node).embeds;
	if (external !== null) {
		keys.push(`link:${external}`);
	}
	return keys;
};

/**
 * checks whether a post has attachments that can carry content warnings.
 *
 * @param state the editor state
 * @param node the post plot
 * @returns whether the post has media or an external link card
 */
export const canLabelPost = (state: GardState, node: Plot): boolean => {
	return getPostParam(node).media.length > 0 || getPostInfo(state, node).embeds.external !== null;
};

/**
 * checks whether any of a post's attachments carry content warnings.
 *
 * @param state the editor state
 * @param node the post plot
 * @returns whether a warning is set
 */
export const hasPostLabels = (state: GardState, node: Plot): boolean => {
	const labels = state.field(labelTaint.field);
	if (labels.size === 0) {
		return false;
	}

	return getAttachmentKeys(state, node).some((key) => labels.has(key));
};

/**
 * combines attachment content warnings.
 *
 * @param state the editor state
 * @param keys the attachments' keys, from {@link getAttachmentKeys}
 * @returns the combined labels, keeping the most severe adult content label
 */
export const getTaintedLabels = (state: GardState, keys: readonly string[]): SelfLabel[] => {
	const labels = state.field(labelTaint.field);
	return normalizeSelfLabels(keys.flatMap((key) => labels.get(key) ?? []));
};

/**
 * replaces attachment content warnings. not undoable.
 *
 * @param wg the editor
 * @param keys the attachments' keys, from {@link getAttachmentKeys}
 * @param labels replacement labels; an empty array clears warnings
 */
export const setAttachmentLabels = (
	wg: Wordgard,
	keys: readonly string[],
	labels: readonly SelfLabel[],
): void => {
	labelTaint.set(wg, keys, normalizeSelfLabels(labels));
};

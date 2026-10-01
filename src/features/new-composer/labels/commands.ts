import type { Wordgard } from 'wordgard/editor';

import { isSameSelfLabels, normalizeSelfLabels, type SelfLabel } from '#/lib/moderation/self-labels';

import type { PostMedia } from '../editor/schema';
import { defineTaint, type TaintMap } from '../editor/taints';
import type { PostEmbeds } from '../embeds/link-embeds';

/** content warnings per attachment key. */
export const labelTaint = defineTaint<readonly SelfLabel[]>({
	isEmpty: (labels) => labels.length === 0,
	isSame: isSameSelfLabels,
});

/**
 * lists a post's labelable attachment keys.
 *
 * @param media the post's media
 * @param embeds the post's link embeds
 * @returns keys for media and the external link card, excluding record embeds
 */
export const getAttachmentKeys = (media: readonly PostMedia[], embeds: PostEmbeds): string[] => {
	const keys = media.map((item) => `media:${item.id}`);
	if (embeds.external !== null) {
		keys.push(`link:${embeds.external}`);
	}
	return keys;
};

/**
 * computes a post's content warnings from its attachments.
 *
 * @param labels the labels per attachment key
 * @param keys the post's attachment keys
 * @returns the combined labels, keeping the most severe adult content label
 */
export const getTaintedLabels = (
	labels: TaintMap<readonly SelfLabel[]>,
	keys: readonly string[],
): SelfLabel[] => {
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

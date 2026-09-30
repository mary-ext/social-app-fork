import type { Wordgard } from 'wordgard/editor';
import { Transaction } from 'wordgard/state';

import { normalizeSelfLabels, type SelfLabel } from '#/lib/moderation/self-labels';

import type { PostMedia } from '../editor/schema';
import type { PostEmbeds } from '../embeds/link-embeds';

// key labels by media id or URL so they follow attachments across posts. keep them outside the
// document so undoing attachment changes preserves their labels.

/** content warnings per attachment key. */
export type LabelTaints = ReadonlyMap<string, readonly SelfLabel[]>;

export const emptyLabelTaints: LabelTaints = new Map();

type TaintSpec = { keys: readonly string[]; labels: readonly SelfLabel[] };

const taintEffect = Transaction.Effect.define<TaintSpec>();

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
 * @param taints the labels per attachment key
 * @param keys the post's attachment keys
 * @returns the combined labels, keeping the most severe adult content label
 */
export const getTaintedLabels = (taints: LabelTaints, keys: readonly string[]): SelfLabel[] => {
	return normalizeSelfLabels(keys.flatMap((key) => taints.get(key) ?? []));
};

/**
 * applies a transaction's label changes.
 *
 * @param taints the current labels per attachment key
 * @param tr the transaction
 * @returns updated labels, or the original map if there are no label effects
 */
export const applyLabelTaints = (taints: LabelTaints, tr: Transaction): LabelTaints => {
	let next: Map<string, readonly SelfLabel[]> | null = null;
	for (const effect of tr.effects) {
		if (effect.is(taintEffect)) {
			next ??= new Map(taints);
			for (const key of effect.value.keys) {
				if (effect.value.labels.length > 0) {
					next.set(key, effect.value.labels);
				} else {
					next.delete(key);
				}
			}
		}
	}

	return next ?? taints;
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
	wg.dispatch({ effects: taintEffect.of({ keys, labels: normalizeSelfLabels(labels) }) });
};

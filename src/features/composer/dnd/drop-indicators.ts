import './drop-indicators.css';

import { Decoration, PointSet, type Wordgard } from 'wordgard/editor';
import { GardState, Transaction } from 'wordgard/state';

import { findPostById, getPosts } from '../model/schema';
import { POST_DRAGGING_ATTR, POST_DROP_TARGET_ATTR } from '../shared/elements';

/**
 * where dropped media would land.
 *
 * - `post`: before image `slot`, or after attachments of the same kind if null.
 * - `newPost`: in a new post appended to the thread.
 */
export type MediaDrop = { kind: 'post'; postId: string; slot: number | null } | { kind: 'newPost' };

/**
 * destination of the current drag.
 *
 * - `post`: `slot` is the insertion index before removing the dragged post.
 * - `media`: `drop` is the attachment or file destination.
 *
 * a null destination means the pointer is outside the editor or the drop would change nothing.
 */
export type DropIndicator =
	| { kind: 'post'; postId: string; slot: number | null }
	| { kind: 'media'; drop: MediaDrop | null };

const isSameMediaDrop = (a: MediaDrop | null, b: MediaDrop | null): boolean => {
	if (a === null || b === null || a.kind === 'newPost' || b.kind === 'newPost') {
		return a?.kind === b?.kind;
	}

	return a.postId === b.postId && a.slot === b.slot;
};

const isSameIndicator = (a: DropIndicator | null, b: DropIndicator | null): boolean => {
	if (a === null || b === null) {
		return a === b;
	}

	switch (a.kind) {
		case 'post': {
			return b.kind === 'post' && a.postId === b.postId && a.slot === b.slot;
		}
		case 'media': {
			return b.kind === 'media' && isSameMediaDrop(a.drop, b.drop);
		}
	}
};

const setDropIndicator = Transaction.Effect.define<DropIndicator | null>();

const draggingDeco = Decoration.Point.attributes({ [POST_DRAGGING_ATTR]: '' });
const dropTargetDeco = Decoration.Point.attributes({ [POST_DROP_TARGET_ATTR]: '' });
/** the current drag's drop indicator, or null outside a drag. */
export const dropIndicator = GardState.Field.define<DropIndicator | null>({
	create() {
		return null;
	},
	update(value, tr) {
		let next = value;
		for (const effect of tr.effects) {
			if (effect.is(setDropIndicator)) {
				next = effect.value;
			}
		}

		return next;
	},
	provide(field) {
		return Decoration.Point.source.of((state) => {
			const indicator = state.field(field);
			if (indicator === null) {
				return PointSet.empty;
			}

			switch (indicator.kind) {
				case 'media': {
					// new post drops are drawn by the drop zone after the thread.
					const { drop } = indicator;
					const post = drop?.kind === 'post' && findPostById(state.doc, drop.postId);
					return post ? PointSet.create([[post.pos, dropTargetDeco]]) : PointSet.empty;
				}
				case 'post': {
					const post = findPostById(state.doc, indicator.postId);
					if (!post) {
						return PointSet.empty;
					}

					return PointSet.create([[post.pos, draggingDeco]]);
				}
			}
		});
	},
});

/**
 * updates the drop indicator.
 *
 * @param wg the editor
 * @param indicator the new indicator, or null to clear it
 */
export const markDropIndicator = (wg: Wordgard, indicator: DropIndicator | null): void => {
	if (!isSameIndicator(wg.state.field(dropIndicator), indicator)) {
		wg.dispatch({ effects: setDropIndicator.of(indicator) });
	}
};

/**
 * reads the post being dragged.
 *
 * @param state the editor state
 * @returns the post's id, or null when no post drag is in progress
 */
export const getDraggedPostId = (state: GardState): string | null => {
	const indicator = state.field(dropIndicator);
	return indicator?.kind === 'post' ? indicator.postId : null;
};

/** a post edge marking the insertion destination. */
export type PostDropMarker = { postId: string; edge: 'after' | 'before' };

/**
 * resolves the current post drag's insertion marker.
 *
 * @param state the editor state
 * @returns the marker, or null when no post insertion is indicated
 */
export const getPostDropMarker = (state: GardState): PostDropMarker | null => {
	const indicator = state.field(dropIndicator);
	if (indicator?.kind !== 'post' || indicator.slot === null) {
		return null;
	}

	const posts = getPosts(state.doc);
	const at = posts[indicator.slot];
	if (at) {
		return { postId: at.id, edge: 'before' };
	}

	const last = posts[posts.length - 1];
	return last ? { postId: last.id, edge: 'after' } : null;
};

/** the drop indicator of an attachment or file drag. */
export type MediaDrag = Extract<DropIndicator, { kind: 'media' }>;

/**
 * reads the current attachment or file drag.
 *
 * @param state the editor state
 * @returns the indicator, or null when no media drag is in progress
 */
export const getMediaDrag = (state: GardState): MediaDrag | null => {
	const indicator = state.field(dropIndicator);
	return indicator?.kind === 'media' ? indicator : null;
};

/**
 * reads a post's image insertion slot for the current drag.
 *
 * @param drag the media drag, or null outside one
 * @param postId the post's id
 * @returns the image insertion slot, or null if none targets this post
 */
export const getDropSlot = (drag: MediaDrag | null, postId: string): number | null => {
	const drop = drag?.drop;
	return drop?.kind === 'post' && drop.postId === postId ? drop.slot : null;
};

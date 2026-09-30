import { Decoration, PointSet, type Wordgard } from 'wordgard/editor';
import { GardState, Transaction } from 'wordgard/state';

import { findPostById, getPosts } from '../editor/schema';
import {
	POST_DRAGGING_ATTR,
	POST_DROP_AFTER_ATTR,
	POST_DROP_BEFORE_ATTR,
	POST_DROP_TARGET_ATTR,
} from '../elements';

/**
 * where dropped media would land.
 *
 * - `post`: in an existing post's media, inserted before `slot`.
 * - `newPost`: in a new post appended to the thread.
 */
export type MediaDrop = { kind: 'post'; postId: string; slot: number } | { kind: 'newPost' };

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
const dropBeforeDeco = Decoration.Point.attributes({ [POST_DROP_BEFORE_ATTR]: '' });
const dropAfterDeco = Decoration.Point.attributes({ [POST_DROP_AFTER_ATTR]: '' });

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
					const posts = getPosts(state.doc);
					const post = posts.find((entry) => entry.id === indicator.postId);
					if (!post) {
						return PointSet.empty;
					}

					const marks: [number, typeof draggingDeco][] = [[post.pos, draggingDeco]];
					if (indicator.slot !== null) {
						// append slots use the last post's trailing edge.
						const at = posts[indicator.slot];
						const last = posts[posts.length - 1]!;
						marks.push(at ? [at.pos, dropBeforeDeco] : [last.pos, dropAfterDeco]);
					}

					// point sets expect ascending positions.
					return PointSet.create(marks.toSorted((a, b) => a[0] - b[0]));
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
 * reads a post's media insertion slot for the current drag.
 *
 * @param drag the media drag, or null outside one
 * @param postId the post's id
 * @returns the insertion slot, or null when the drag wouldn't land in that post
 */
export const getDropSlot = (drag: MediaDrag | null, postId: string): number | null => {
	const drop = drag?.drop;
	return drop?.kind === 'post' && drop.postId === postId ? drop.slot : null;
};

import { Decoration, PointSet, type Wordgard } from 'wordgard/editor';
import { GardState, Transaction } from 'wordgard/state';

import { getPosts } from '../editor/schema';
import { POST_DROP_AFTER_ATTR, POST_DROP_BEFORE_ATTR, POST_DROP_TARGET_ATTR } from '../elements';

// #region media drop target

const dropDeco = Decoration.Point.attributes({ [POST_DROP_TARGET_ATTR]: '' });

/** position before the media drop target, or null to clear it. */
const setDropTarget = Transaction.Effect.define<number | null>({
	map: (pos, mapping) => (pos === null ? null : mapping.mapPos(pos)),
});

/**
 * highlights the media drop target.
 *
 * @param wg the editor
 * @param pos the position before the post, or null to clear the highlight
 */
export const markDropTarget = (wg: Wordgard, pos: number | null): void => {
	if (wg.state.field(dropTarget) !== pos) {
		wg.dispatch({ effects: setDropTarget.of(pos) });
	}
};

/** media drop target position, retained across editor redraws. */
export const dropTarget = GardState.Field.define<number | null>({
	create() {
		return null;
	},
	update(value, tr) {
		let next = tr.docChanged && value !== null ? tr.changes.mapPos(value) : value;
		for (const effect of tr.effects) {
			if (effect.is(setDropTarget)) {
				next = effect.value;
			}
		}

		return next;
	},
	provide(field) {
		return Decoration.Point.source.of((state) => {
			const pos = state.field(field);
			return pos === null ? PointSet.empty : PointSet.create([[pos, dropDeco]]);
		});
	},
});

// #endregion

// #region post drop slot

const dropBeforeDeco = Decoration.Point.attributes({ [POST_DROP_BEFORE_ATTR]: '' });
const dropAfterDeco = Decoration.Point.attributes({ [POST_DROP_AFTER_ATTR]: '' });

const setPostDropSlot = Transaction.Effect.define<number | null>();

/** insertion index for a dragged post, or null. */
export const postDropSlot = GardState.Field.define<number | null>({
	create() {
		return null;
	},
	update(value, tr) {
		let next = value;
		for (const effect of tr.effects) {
			if (effect.is(setPostDropSlot)) {
				next = effect.value;
			}
		}

		return next;
	},
	provide(field) {
		return Decoration.Point.source.of((state) => {
			const slot = state.field(field);
			if (slot === null) {
				return PointSet.empty;
			}

			// append slots use the last post's trailing edge.
			const posts = getPosts(state.doc);
			const at = posts[slot];
			if (at) {
				return PointSet.create([[at.pos, dropBeforeDeco]]);
			}

			const last = posts[posts.length - 1];
			return last ? PointSet.create([[last.pos, dropAfterDeco]]) : PointSet.empty;
		});
	},
});

/**
 * highlights the insertion slot for a dragged post.
 *
 * @param wg the editor
 * @param slot the index the post would be inserted before, or null to clear the line
 */
export const markPostDropSlot = (wg: Wordgard, slot: number | null): void => {
	if (wg.state.field(postDropSlot) !== slot) {
		wg.dispatch({ effects: setPostDropSlot.of(slot) });
	}
};

// #endregion

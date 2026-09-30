import { createDnd, type DndChannel, type Input } from '@oomfware/tug';
import { attachClosestEdge, extractClosestEdge } from '@oomfware/tug/hitbox';
import { getReorderDestinationIndex } from '@oomfware/tug/reorder';

import type { Wordgard } from 'wordgard/editor';

import type { PostMedia } from '../editor/schema';
import { MEDIA_ID_ATTR, POST_ELEMENT } from '../elements';

/** in-page drag payload; external files use native drop handlers. */
export type ThreadDragData =
	| { kind: 'post'; postId: string; index: number }
	| { kind: 'media'; postId: string; mediaId: string; mediaKind: PostMedia['kind']; index: number };

/** drop target data; the editor is the channel's only drop target. */
export type ThreadDropData = { kind: 'thread' };

/** the thread editor's drag channel. */
export type ThreadDnd = DndChannel<ThreadDragData, ThreadDropData>;

/**
 * creates the editor's drag channel.
 *
 * @returns a channel isolated to this editor's own draggables
 */
export const createThreadDnd = (): ThreadDnd => createDnd<ThreadDragData, ThreadDropData>();

/**
 * checks for a drag carrying files from outside the page.
 *
 * @param transfer the drag's data transfer
 * @returns whether the drop would attach files
 */
export const isFileDrag = (transfer: DataTransfer): boolean => {
	return transfer.types.includes('Files');
};

/**
 * adjusts an insertion slot for removal of the dragged item.
 *
 * @param slot the index the item would be inserted before, counting the item itself
 * @param from the item's current index
 * @returns the destination index, or null when the item would stay in place
 */
export const getMoveIndex = (slot: number, from: number): number | null => {
	if (slot === from || slot === from + 1) {
		return null;
	}

	return slot > from ? slot - 1 : slot;
};

/**
 * finds a post by vertical position, including its media and footer. positions outside the thread resolve to
 * the nearest end post.
 *
 * @param wg the editor
 * @param clientY the pointer's client y
 * @returns the post's thread index and element, or null for an empty thread
 */
export const getPostAt = (wg: Wordgard, clientY: number): { index: number; element: Element } | null => {
	const posts = [...wg.dom.querySelectorAll(POST_ELEMENT)];
	const found = posts.findIndex((post) => clientY < post.getBoundingClientRect().bottom);
	const index = found === -1 ? posts.length - 1 : found;
	const element = posts[index];
	return element ? { index, element } : null;
};

/**
 * finds the insertion slot for a dragged post.
 *
 * @param wg the editor
 * @param input the pointer position
 * @returns the index the post would be inserted before, counting the dragged post itself
 */
export const getPostDropSlot = (wg: Wordgard, input: Input): number => {
	const target = getPostAt(wg, input.clientY);
	if (!target) {
		return 0;
	}

	return getReorderDestinationIndex({
		axis: 'vertical',
		closestEdgeOfTarget: extractClosestEdge(
			attachClosestEdge({}, { allowedEdges: ['bottom', 'top'], element: target.element, input }),
		),
		indexOfTarget: target.index,
		startIndex: -1,
	});
};

/**
 * finds an image insertion slot by horizontal position.
 *
 * @param group the image group element
 * @param x the pointer's client x
 * @returns the index an image would be inserted before, or the tile count to append
 */
export const getImageDropSlot = (group: Element, x: number): number => {
	const tiles = [...group.querySelectorAll(`[${MEDIA_ID_ATTR}]`)];
	const before = tiles.findIndex((tile) => {
		const rect = tile.getBoundingClientRect();
		return x < rect.left + rect.width / 2;
	});

	return before === -1 ? tiles.length : before;
};

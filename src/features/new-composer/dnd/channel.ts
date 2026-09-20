import { createDnd, type DndChannel, type Input } from '@oomfware/tug';
import { attachClosestEdge, extractClosestEdge } from '@oomfware/tug/hitbox';
import { getReorderDestinationIndex } from '@oomfware/tug/reorder';

import type { Wordgard } from 'wordgard/editor';

import { POST_ELEMENT } from '../elements';

/** in-page drag payload; external files use native drop handlers. */
export type ThreadDragData =
	| { kind: 'post'; postId: string; index: number }
	| { kind: 'media'; postId: string; mediaId: string; index: number };

/** drop target data; the innermost target takes precedence. */
export type ThreadDropData =
	| { kind: 'post'; index: number }
	| { kind: 'mediaTile'; postId: string; index: number }
	| { kind: 'mediaGrid'; postId: string };

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
 * finds a post's drop index after removing it from its current position.
 *
 * @param wg the editor
 * @param input the pointer position
 * @param startIndex the dragged post's current index, or -1 when it isn't in the thread
 * @returns the destination index
 */
export const getPostDropIndex = (wg: Wordgard, input: Input, startIndex: number): number => {
	// use full post bounds so gutter, media, and footer drops share the same midpoint.
	const posts = [...wg.dom.querySelectorAll(POST_ELEMENT)];

	const found = posts.findIndex((post) => input.clientY < post.getBoundingClientRect().bottom);
	const indexOfTarget = found === -1 ? posts.length - 1 : found;
	const element = posts[indexOfTarget];
	if (!element) {
		return 0;
	}

	return getReorderDestinationIndex({
		axis: 'vertical',
		closestEdgeOfTarget: extractClosestEdge(
			attachClosestEdge({}, { allowedEdges: ['bottom', 'top'], element, input }),
		),
		indexOfTarget,
		startIndex,
	});
};

/**
 * returns the index a dragged attachment would land at within a post's media.
 *
 * @param data the tile drop target's data, carrying the closest edge
 * @param startIndex the dragged entry's current index in that post, or -1 when it comes from elsewhere
 * @returns the destination index, or -1 for a non-tile target
 */
export const getMediaDropIndex = (data: ThreadDropData, startIndex: number): number => {
	if (data.kind !== 'mediaTile') {
		return -1;
	}

	const edge = extractClosestEdge(data);
	return getReorderDestinationIndex({
		axis: edge === 'top' || edge === 'bottom' ? 'vertical' : 'horizontal',
		closestEdgeOfTarget: edge,
		indexOfTarget: data.index,
		startIndex,
	});
};

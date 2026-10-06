import type { Input } from '@oomfware/tug';
import { attachClosestEdge, extractClosestEdge } from '@oomfware/tug/hitbox';
import { getReorderDestinationIndex } from '@oomfware/tug/reorder';

import type { Wordgard } from 'wordgard/editor';

import { getPostParam, getPosts, splitMedia, type ThreadPost } from '../model/schema';
import {
	IMAGE_GROUP_ATTR,
	MEDIA_ID_ATTR,
	NEW_POST_ZONE_ATTR,
	POST_ID_ATTR,
	POST_OVERLAY_ATTR,
} from '../shared/elements';
import type { MediaDrop } from './drop-indicators';

/** a pointer position in client coordinates. */
export type Point = { clientX: number; clientY: number };

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

// positions outside the thread resolve to the nearest end post.
const getPostAt = (wg: Wordgard, clientY: number): { post: ThreadPost; element: Element } | null => {
	let last: { post: ThreadPost; element: Element } | null = null;
	for (const post of getPosts(wg.state.doc)) {
		const element = wg.nodeDOM(post.pos);
		if (!element) {
			continue;
		}

		last = { post, element };
		if (clientY < element.getBoundingClientRect().bottom) {
			break;
		}
	}

	return last;
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
		indexOfTarget: target.post.index,
		startIndex: -1,
	});
};

// finds the image insertion slot by horizontal position, or the tile count to append.
const getImageDropSlot = (group: Element, x: number): number => {
	const tiles = [...group.querySelectorAll(`[${MEDIA_ID_ATTR}]`)];
	const before = tiles.findIndex((tile) => {
		const rect = tile.getBoundingClientRect();
		return x < rect.left + rect.width / 2;
	});

	return before === -1 ? tiles.length : before;
};

/**
 * finds where media dropped at a point would land.
 *
 * @param container the element hosting the editor, its post overlays, and the new post zone
 * @param wg the editor
 * @param point the pointer position
 * @returns the destination, or null for an empty thread
 */
export const getMediaDrop = (container: Element, wg: Wordgard, point: Point): MediaDrop | null => {
	const zone = container.querySelector(`[${NEW_POST_ZONE_ATTR}]`);
	if (zone && point.clientY >= zone.getBoundingClientRect().top) {
		return { kind: 'newPost' };
	}

	const post = getPostAt(wg, point.clientY)?.post;
	if (!post) {
		return null;
	}

	const group = container.querySelector(
		`[${POST_OVERLAY_ATTR}][${POST_ID_ATTR}="${CSS.escape(post.id)}"] [${IMAGE_GROUP_ATTR}]`,
	);
	if (group) {
		// ignore horizontal bounds so drops in the rail also pick a slot.
		const rect = group.getBoundingClientRect();
		if (point.clientY >= rect.top && point.clientY <= rect.bottom) {
			return { kind: 'post', postId: post.id, slot: getImageDropSlot(group, point.clientX) };
		}
	}

	const { images } = splitMedia(getPostParam(post.node).media);
	return { kind: 'post', postId: post.id, slot: images.length };
};

import type { Edge } from '@oomfware/tug/hitbox';
import { getReorderDestinationIndex, reorder } from '@oomfware/tug/reorder';

import type { DragData, SavedFeed, Section } from './types';

/**
 * moves a feed one slot up or down within its own section.
 *
 * @param feeds the full feeds list.
 * @param options the target feed's section, its section-relative index, and the move direction.
 * @returns a new feeds list with the feed moved.
 */
export function moveWithinSection(
	feeds: SavedFeed[],
	{ direction, index, section }: { direction: 'down' | 'up'; index: number; section: Section },
): SavedFeed[] {
	const isPinned = section === 'pinned';
	const inSection = (f: SavedFeed) => (isPinned ? f.pinned : !f.pinned);
	const reordered = reorder(feeds.filter(inSection), index, direction === 'up' ? index - 1 : index + 1);
	const others = feeds.filter((f) => !inSection(f));
	return isPinned ? [...reordered, ...others] : [...others, ...reordered];
}

/**
 * removes a feed from the list.
 *
 * @param feeds the full feeds list.
 * @param id the id of the feed to remove.
 * @returns a new feeds list without the feed.
 */
export function removeFeed(feeds: SavedFeed[], id: string): SavedFeed[] {
	return feeds.filter((f) => f.id !== id);
}

/**
 * reorders a feed dropped by drag-and-drop, handling both within-section moves and cross-section moves that
 * flip the feed's pinned state.
 *
 * @param options the drop's closest edge, the current feeds, the drag source, and the drop target's index and
 *   section.
 * @returns a new feeds list, or null if the drop would leave the list unchanged.
 */
export function reorderSavedFeeds({
	edge,
	feeds,
	source,
	targetIndex,
	targetSection,
}: {
	edge: Edge | null;
	feeds: SavedFeed[];
	source: DragData;
	targetIndex: number;
	targetSection: Section;
}): SavedFeed[] | null {
	const pinned = feeds.filter((f) => f.pinned);
	const unpinned = feeds.filter((f) => !f.pinned);
	const fromArr = source.section === 'pinned' ? pinned : unpinned;
	const sourceIndex = fromArr.findIndex((f) => f.id === source.id);
	const feed = fromArr[sourceIndex];
	if (!feed) {
		return null;
	}

	if (source.section === targetSection) {
		const finishIndex = getReorderDestinationIndex({
			axis: 'vertical',
			closestEdgeOfTarget: edge,
			indexOfTarget: targetIndex,
			startIndex: sourceIndex,
		});
		if (finishIndex === sourceIndex) {
			return null;
		}
		const reordered = reorder(fromArr, sourceIndex, finishIndex);
		return source.section === 'pinned' ? [...reordered, ...unpinned] : [...pinned, ...reordered];
	}

	// cross-section: pull the feed out of its section and splice it into the other, flipping `pinned`.
	const toArr = targetSection === 'pinned' ? pinned : unpinned;
	const withoutSource = fromArr.filter((_, i) => i !== sourceIndex);
	const finishIndex = getReorderDestinationIndex({
		axis: 'vertical',
		closestEdgeOfTarget: edge,
		indexOfTarget: targetIndex,
		startIndex: -1,
	});
	const moved: SavedFeed = { ...feed, pinned: targetSection === 'pinned' };
	const nextTo = [...toArr.slice(0, finishIndex), moved, ...toArr.slice(finishIndex)];
	return targetSection === 'pinned' ? [...nextTo, ...withoutSource] : [...withoutSource, ...nextTo];
}

/**
 * toggles a feed's pinned state.
 *
 * @param feeds the full feeds list.
 * @param id the id of the feed to toggle.
 * @returns a new feeds list with the feed's `pinned` flipped.
 */
export function togglePin(feeds: SavedFeed[], id: string): SavedFeed[] {
	return feeds.map((f) => (f.id === id ? { ...f, pinned: !f.pinned } : f));
}

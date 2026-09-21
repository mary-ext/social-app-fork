import type { DragEvent } from 'react';

import type { Wordgard } from 'wordgard/editor';

import { movePostToSlot } from '../commands/reorder-posts';
import { findPost, getPostParam, type ThreadPost } from '../editor/schema';
import { MEDIA_GRID_ATTR } from '../elements';
import { attachFiles, moveMediaTo, moveMediaToSlot } from '../media/commands';
import { getMediaDropIndex, getPostDropIndex, isFileDrag, type ThreadDnd } from './channel';
import { markDropTarget, markPostDropSlot } from './drop-indicators';

// media grids handle their own drops to support insertion between attachments.
const isOverMediaGrid = (event: DragEvent) => {
	return event.target instanceof Element && event.target.closest(`[${MEDIA_GRID_ATTR}]`) !== null;
};

const getPostUnder = (
	wg: Wordgard,
	point: { clientX: number; clientY: number },
): Pick<ThreadPost, 'node' | 'pos' | 'id'> | null => {
	const { pos } = wg.posAtCoords({ x: point.clientX, y: point.clientY });
	const found = findPost(wg.state.doc.resolve(pos));
	return found && { node: found.node, pos: found.before, id: getPostParam(found.node).id };
};

/**
 * handles post and attachment drops within the editor.
 *
 * @param wg the editor
 * @param dnd the editor's drag channel
 * @param container the element hosting the editor
 * @returns a function that stops handling drops
 */
export const registerThreadDrop = (wg: Wordgard, dnd: ThreadDnd, container: HTMLElement): (() => void) => {
	// posts share a fallback target; media grids and tiles take precedence.
	const stopDropping = dnd.dropTarget({
		element: container,
		getData: () => ({ kind: 'post', index: -1 }),
		onDrag: ({ location, source }) => {
			if (source.data.kind === 'post') {
				markPostDropSlot(wg, getPostDropIndex(wg, location.current.input, -1));
			} else {
				markDropTarget(wg, getPostUnder(wg, location.current.input)?.pos ?? null);
			}
		},
		onDragLeave: () => {
			markPostDropSlot(wg, null);
			markDropTarget(wg, null);
		},
		onDrop: () => {
			markPostDropSlot(wg, null);
			markDropTarget(wg, null);
		},
	});

	const stopMonitoring = dnd.monitor({
		onDrop: ({ location, source }) => {
			markPostDropSlot(wg, null);
			markDropTarget(wg, null);

			// targets are ordered innermost first: tile, grid, editor.
			const target = location.current.dropTargets[0];
			if (!target) {
				return;
			}

			if (source.data.kind === 'post') {
				// account for removal from the source index.
				const to = getPostDropIndex(wg, location.current.input, source.data.index);
				movePostToSlot(wg, source.data.postId, to);
			} else if (target.data.kind === 'post') {
				// drops on post text append media.
				const under = getPostUnder(wg, location.current.input);
				if (under) {
					moveMediaTo(wg, source.data.postId, source.data.mediaId, under.id);
				}
			} else {
				const { postId, mediaId, index } = source.data;
				const toId = target.data.postId;
				const at = getMediaDropIndex(target.data, toId === postId ? index : -1);
				moveMediaToSlot(wg, postId, mediaId, toId, at === -1 ? undefined : at);
			}

			// blurred editors don't update the DOM selection; focus applies the moved selection.
			wg.focus();
		},
	});

	return () => {
		stopDropping();
		stopMonitoring();
	};
};

/**
 * handles external file drops on the post under the pointer.
 *
 * @param wg the editor, or null before it mounts
 * @returns handlers for the element hosting the editor
 */
export const createFileDropHandlers = (wg: Wordgard | null) => {
	return {
		// intercept files before the editor's content drop handler.
		onDragOverCapture: (event: DragEvent) => {
			if (!wg || !isFileDrag(event.dataTransfer) || isOverMediaGrid(event)) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			markDropTarget(wg, getPostUnder(wg, event)?.pos ?? null);
		},
		onDragLeave: (event: DragEvent) => {
			if (wg && !(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) {
				markDropTarget(wg, null);
			}
		},
		onDropCapture: (event: DragEvent) => {
			if (!wg || !isFileDrag(event.dataTransfer) || isOverMediaGrid(event)) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			markDropTarget(wg, null);

			const post = getPostUnder(wg, event);
			if (!post) {
				return;
			}

			// copy files before the drop event expires.
			void attachFiles(wg, post.id, [...event.dataTransfer.files]);
			wg.focus();
		},
	};
};

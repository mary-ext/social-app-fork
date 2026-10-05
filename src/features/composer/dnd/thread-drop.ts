import type { Input } from '@oomfware/tug';

import type { Wordgard } from 'wordgard/editor';

import { movePostToSlot } from '../commands/reorder-posts';
import { createMedia } from '../media/attachments';
import {
	addMediaInNewPost,
	addMediaTo,
	insertMediaAt,
	moveMediaTo,
	moveMediaToNewPost,
	moveMediaToSlot,
} from '../media/commands';
import { getMediaTileSelector, IMAGE_GROUP_ATTR } from '../shared/elements';
import type { ThreadDnd, ThreadDragData } from './channel';
import { type DropIndicator, dropIndicator, markDropIndicator, type MediaDrop } from './drop-indicators';
import { getMediaDrop, getMoveIndex, getPostDropSlot, isFileDrag, type Point } from './drop-targets';
import { createEdgeScroller } from './edge-scroll';

// carousels re-snap to their previous tile after a reorder; bring the moved one into view instead.
const revealMedia = (mediaId: string) => {
	requestAnimationFrame(() => {
		const tile = document.querySelector(getMediaTileSelector(mediaId));
		if (!tile) {
			return;
		}

		// in Firefox, 'nearest' can snap back to an earlier tile; use 'start' for clipped tiles.
		let inline: ScrollLogicalPosition = 'nearest';
		{
			const group = tile.closest(`[${IMAGE_GROUP_ATTR}]`);
			if (group) {
				const rect = tile.getBoundingClientRect();
				const bounds = group.getBoundingClientRect();
				// exclude the rail gutter from the visible bounds.
				const left = bounds.left + parseFloat(getComputedStyle(group).scrollPaddingLeft);
				if (rect.left < left || rect.right > bounds.right) {
					inline = 'start';
				}
			}
		}

		tile.scrollIntoView({ block: 'nearest', inline });
	});
};

// #region in-page drags

type MediaSource = Extract<ThreadDragData, { kind: 'media' }>;

// keeps the dragged post dimmed and the new post zone open while the pointer is outside the editor.
const getIdleIndicator = (source: ThreadDragData): DropIndicator => {
	switch (source.kind) {
		case 'post': {
			return { kind: 'post', postId: source.postId, slot: null };
		}
		case 'media': {
			return { kind: 'media', drop: null };
		}
	}
};

// hides drops that would leave the attachment where it is.
const getMediaIndicator = (source: MediaSource, hit: MediaDrop | null): DropIndicator => {
	let drop = hit;
	// non-image drags target a post, not an insertion slot.
	if (drop?.kind === 'post' && source.mediaKind !== 'image') {
		drop = { ...drop, slot: null };
	}

	const isNoop =
		drop?.kind === 'post' &&
		drop.postId === source.postId &&
		(drop.slot === null || getMoveIndex(drop.slot, source.index) === null);

	return { kind: 'media', drop: isNoop ? null : drop };
};

const applyMediaDrop = (wg: Wordgard, source: MediaSource, drop: MediaDrop): void => {
	const { postId, mediaId, index } = source;
	const ref = { postId, mediaId };

	switch (drop.kind) {
		case 'newPost': {
			moveMediaToNewPost(wg, ref);
			break;
		}
		case 'post': {
			if (drop.slot === null) {
				moveMediaTo(wg, ref, drop.postId);
				break;
			}

			// images lead the post's media, so image slots are also media indices.
			// within a post, the destination counts positions after the attachment's removal.
			const to = drop.postId === postId ? getMoveIndex(drop.slot, index) : drop.slot;
			if (to === null) {
				return;
			}
			moveMediaToSlot(wg, ref, { postId: drop.postId, index: to });
			break;
		}
	}

	revealMedia(mediaId);
};

// use the displayed destination rather than hit-testing again on drop.
const applyDrop = (wg: Wordgard, source: ThreadDragData, indicator: DropIndicator): void => {
	switch (source.kind) {
		case 'post': {
			if (indicator.kind !== 'post' || indicator.slot === null) {
				break;
			}

			const to = getMoveIndex(indicator.slot, source.index);
			if (to !== null) {
				movePostToSlot(wg, source.postId, to);
			}
			break;
		}
		case 'media': {
			if (indicator.kind === 'media' && indicator.drop) {
				applyMediaDrop(wg, source, indicator.drop);
			}
			break;
		}
	}
};

/**
 * handles post and attachment drops within the editor.
 *
 * @param wg the editor
 * @param dnd the editor's drag channel
 * @param container the element hosting the editor and the new post zone
 * @returns a function that stops handling drops
 */
export const registerThreadDrop = (wg: Wordgard, dnd: ThreadDnd, container: HTMLElement): (() => void) => {
	const scroller = createEdgeScroller(container);

	const getDragIndicator = (source: ThreadDragData, input: Input): DropIndicator => {
		switch (source.kind) {
			case 'post': {
				const slot = getPostDropSlot(wg, input);
				return {
					kind: 'post',
					postId: source.postId,
					slot: getMoveIndex(slot, source.index) === null ? null : slot,
				};
			}
			case 'media': {
				scroller.update(input);
				return getMediaIndicator(source, getMediaDrop(container, wg, input));
			}
		}
	};

	const stopDropping = dnd.dropTarget({
		element: container,
		canDrop() {
			return !wg.state.readOnly;
		},
		getData() {
			return { kind: 'thread' };
		},
		onDrag({ location, source }) {
			markDropIndicator(wg, getDragIndicator(source.data, location.current.input));
		},
		onDragLeave({ source }) {
			scroller.stop();
			markDropIndicator(wg, getIdleIndicator(source.data));
		},
	});

	const stopMonitoring = dnd.monitor({
		onDragStart({ source }) {
			markDropIndicator(wg, getIdleIndicator(source.data));
		},
		onDrop({ location, source }) {
			scroller.stop();
			const indicator = wg.state.field(dropIndicator);
			markDropIndicator(wg, null);
			if (location.current.dropTargets.length === 0 || !indicator) {
				return;
			}

			applyDrop(wg, source.data, indicator);
			// blurred editors don't update the DOM selection; focus applies the moved selection.
			wg.focus();
		},
	});

	return () => {
		scroller.stop();
		stopDropping();
		stopMonitoring();
	};
};

// #endregion

// #region file drags

// a null relatedTarget can also occur between elements; allow time for the next dragover.
const LEAVE_DELAY_MS = 100;

/**
 * accepts file drops at media insertion slots and blocks file-drop navigation elsewhere on the page.
 *
 * @param wg the editor
 * @param container the element hosting the editor and the new post zone
 * @returns a function that stops handling file drags
 */
export const registerFileDrop = (wg: Wordgard, container: HTMLElement): (() => void) => {
	const scroller = createEdgeScroller(container);
	const controller = new AbortController();
	let leaving: ReturnType<typeof setTimeout> | undefined;

	// limit hit testing to once per frame.
	let frame = 0;
	let pending: (Point & { isInside: boolean }) | null = null;

	const resolve = () => {
		cancelAnimationFrame(frame);
		frame = 0;
		if (!pending) {
			return;
		}

		const drop = pending.isInside ? getMediaDrop(container, wg, pending) : null;
		if (drop) {
			scroller.update(pending);
		} else {
			scroller.stop();
		}
		pending = null;
		// open the new post zone as soon as files are over the page.
		markDropIndicator(wg, { kind: 'media', drop });
	};

	const halt = () => {
		cancelAnimationFrame(frame);
		frame = 0;
		pending = null;
		scroller.stop();
	};

	const finish = () => {
		halt();
		markDropIndicator(wg, null);
	};

	// prevent the editor and browser from handling file drops themselves.
	const claim = (event: DragEvent): DataTransfer | null => {
		const transfer = event.dataTransfer;
		if (!transfer || !isFileDrag(transfer)) {
			return null;
		}

		event.preventDefault();
		// let other dialogs handle file drops, but allow drops in the thread's own dialog.
		const dialog =
			event.target instanceof Element && event.target.closest('[role="dialog"], [role="alertdialog"]');
		if (dialog && !dialog.contains(container)) {
			transfer.dropEffect = 'none';
			// drop doesn't fire dragleave, so clear any stale thread indicator.
			clearTimeout(leaving);
			finish();
			return null;
		}

		event.stopPropagation();
		clearTimeout(leaving);
		return transfer;
	};

	const onDragOver = (event: DragEvent) => {
		const transfer = claim(event);
		if (!transfer) {
			return;
		}
		// still prevent the browser from navigating to the dropped file while read-only.
		if (wg.state.readOnly) {
			transfer.dropEffect = 'none';
			return;
		}

		const isInside = event.target instanceof Node && container.contains(event.target);
		transfer.dropEffect = isInside ? 'copy' : 'none';
		pending = { clientX: event.clientX, clientY: event.clientY, isInside };
		frame ||= requestAnimationFrame(resolve);
	};

	const onDragLeave = (event: DragEvent) => {
		if (event.dataTransfer && isFileDrag(event.dataTransfer) && event.relatedTarget === null) {
			clearTimeout(leaving);
			leaving = setTimeout(finish, LEAVE_DELAY_MS);
		}
	};

	const onDrop = (event: DragEvent) => {
		const transfer = claim(event);
		if (!transfer) {
			return;
		}

		// settle the latest dragover so the drop lands where the indicator shows.
		resolve();
		const indicator = wg.state.field(dropIndicator);
		const target = indicator?.kind === 'media' ? indicator.drop : null;
		finish();
		if (!target) {
			return;
		}

		// copy files before the drop event expires.
		const files = [...transfer.files];
		void createMedia(files).then(({ media }) => {
			if (target.kind === 'newPost') {
				addMediaInNewPost(wg, media);
			} else if (target.slot === null) {
				addMediaTo(wg, target.postId, media);
			} else {
				insertMediaAt(wg, target.postId, target.slot, media);
			}
		});
		// restore the caret, which does not redraw while the editor is blurred.
		wg.focus();
	};

	const options = { capture: true, signal: controller.signal };
	document.addEventListener('dragover', onDragOver, options);
	document.addEventListener('dragleave', onDragLeave, options);
	document.addEventListener('drop', onDrop, options);

	return () => {
		controller.abort();
		clearTimeout(leaving);
		halt();
	};
};

// #endregion

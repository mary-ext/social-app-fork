import type { Input } from '@oomfware/tug';

import type { Wordgard } from 'wordgard/editor';

import { movePostToSlot } from '../commands/reorder-posts';
import { getPostParam, getPosts } from '../editor/schema';
import { getMediaTileSelector, MEDIA_GRID_ATTR, NEW_POST_ZONE_ATTR } from '../elements';
import { createMedia } from '../media/attachments';
import { addMediaInNewPost, insertMediaAt, moveMediaToNewPost, moveMediaToSlot } from '../media/commands';
import {
	getMediaDropSlot,
	getMoveIndex,
	getPostAt,
	getPostDropSlot,
	isFileDrag,
	type ThreadDnd,
	type ThreadDragData,
} from './channel';
import { type DropIndicator, dropIndicator, markDropIndicator, type MediaDrop } from './drop-indicators';
import { createEdgeScroller } from './edge-scroll';

type Point = { clientX: number; clientY: number };

const getMediaDrop = (container: Element, wg: Wordgard, point: Point): MediaDrop | null => {
	const zone = container.querySelector(`[${NEW_POST_ZONE_ATTR}]`);
	if (zone && point.clientY >= zone.getBoundingClientRect().top) {
		return { kind: 'newPost' };
	}

	const target = getPostAt(wg, point.clientY);
	const post = target && getPosts(wg.state.doc)[target.index];
	if (!target || !post) {
		return null;
	}

	const grid = target.element.querySelector(`[${MEDIA_GRID_ATTR}]`);
	if (grid) {
		// ignore horizontal bounds so drops in the rail also pick a media slot.
		const rect = grid.getBoundingClientRect();
		if (point.clientY >= rect.top && point.clientY <= rect.bottom) {
			return { kind: 'post', postId: post.id, slot: getMediaDropSlot(grid, point.clientX, point.clientY) };
		}
	}

	return { kind: 'post', postId: post.id, slot: getPostParam(post.node).media.length };
};

// carousels re-snap to their previous tile after a reorder; bring the moved one into view instead.
const revealMedia = (mediaId: string) => {
	requestAnimationFrame(() => {
		document
			.querySelector(getMediaTileSelector(mediaId))
			?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
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
const getMediaIndicator = (source: MediaSource, drop: MediaDrop | null): DropIndicator => {
	const isNoop =
		drop?.kind === 'post' && drop.postId === source.postId && getMoveIndex(drop.slot, source.index) === null;

	return { kind: 'media', drop: isNoop ? null : drop };
};

const applyMediaDrop = (wg: Wordgard, source: MediaSource, drop: MediaDrop): void => {
	const { postId, mediaId, index } = source;

	switch (drop.kind) {
		case 'newPost': {
			moveMediaToNewPost(wg, postId, mediaId);
			break;
		}
		case 'post': {
			// within a post, the destination counts positions after the attachment's removal.
			const to = drop.postId === postId ? getMoveIndex(drop.slot, index) : drop.slot;
			if (to === null) {
				return;
			}
			moveMediaToSlot(wg, postId, mediaId, drop.postId, to);
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
		getData: () => ({ kind: 'thread' }),
		onDrag: ({ location, source }) => {
			markDropIndicator(wg, getDragIndicator(source.data, location.current.input));
		},
		onDragLeave: ({ source }) => {
			scroller.stop();
			markDropIndicator(wg, getIdleIndicator(source.data));
		},
	});

	const stopMonitoring = dnd.monitor({
		onDragStart: ({ source }) => {
			markDropIndicator(wg, getIdleIndicator(source.data));
		},
		onDrop: ({ location, source }) => {
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
		event.stopPropagation();
		clearTimeout(leaving);
		return transfer;
	};

	const onDragOver = (event: DragEvent) => {
		const transfer = claim(event);
		if (!transfer) {
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

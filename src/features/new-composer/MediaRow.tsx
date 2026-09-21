import { memo, useState } from 'react';

import { attachClosestEdge } from '@oomfware/tug/hitbox';

import type { Wordgard } from 'wordgard/editor';

import type { AttachmentKind } from '#/lib/media/read-attachment';

import { getSelectionErrorMessage } from '#/features/composer/media/attachment-messages';

import { Text } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';

import XIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { findActivePost, markDropTarget, type PostSummary } from './decorations';
import type { ThreadDnd } from './dnd';
import { isFileDrag } from './drag';
import {
	MEDIA_GRID_ATTR,
	MEDIA_ID_ATTR,
	MEDIA_INSERT_AFTER_ATTR,
	MEDIA_INSERT_BEFORE_ATTR,
} from './elements';
import { escapeToEditor, keepEditorFocus } from './focus';
import {
	createMedia,
	getMediaUrl,
	insertMediaAt,
	moveMediaDown,
	moveMediaUp,
	nudgeMedia,
	removeMedia,
} from './media';
import * as styles from './MediaRow.css';
import { type RovingItemProps, useRovingFocus } from './roving';
import { endOfLastLine, findPostById, getPostParam, getPosts, type PostMedia } from './schema';

/**
 * a post's attachments and media errors.
 *
 * @param props the editor, drag state, post summary, and whether attachments are tabbable
 * @returns the media row, or null if there are no attachments or errors
 */
export const MediaRow = memo(function MediaRow({
	wg,
	dnd,
	post,
	isActive,
}: {
	wg: Wordgard;
	dnd: ThreadDnd;
	post: PostSummary;
	isActive: boolean;
}) {
	if (post.media.length === 0 && !post.mediaProblem) {
		return null;
	}

	return (
		<div className={styles.root}>
			{post.media.length > 0 && (
				<MediaGrid wg={wg} dnd={dnd} postId={post.id} media={post.media} isActive={isActive} />
			)}

			{post.mediaProblem && (
				<Text size="md_sub" color="negative_600">
					{getSelectionErrorMessage(post.mediaProblem)}
				</Text>
			)}
		</div>
	);
});

const MEDIA_LABELS: Record<AttachmentKind, string> = {
	gif: 'GIF attachment',
	image: 'Image attachment',
	video: 'Video attachment',
	voice: 'Voice attachment',
};

function MediaPreview({ item, url, tabbable }: { item: PostMedia; url: string; tabbable: boolean }) {
	switch (item.kind) {
		case 'image': {
			return <img className={styles.media} src={url} alt="" />;
		}
		case 'voice': {
			return (
				<audio
					className={styles.media}
					src={url}
					preload="metadata"
					controls
					// keep native controls out of the tab order unless their tile is tabbable.
					tabIndex={tabbable ? undefined : -1}
				/>
			);
		}
		case 'gif':
		case 'video': {
			return <video className={styles.media} src={url} preload="metadata" muted />;
		}
	}
}

// moves replace the tile; restore focus so keyboard moves can repeat.
const refocusMedia = (mediaId: string) => {
	requestAnimationFrame(() => {
		document.querySelector<HTMLElement>(`[${MEDIA_ID_ATTR}="${CSS.escape(mediaId)}"]`)?.focus();
	});
};

// move the caret with the tile so its new post's controls stay tabbable.
const followMedia = (wg: Wordgard, mediaId: string) => {
	const post = getPosts(wg.state.doc).find(({ node }) =>
		getPostParam(node).media.some((entry) => entry.id === mediaId),
	);
	if (post && findActivePost(wg.state)?.before !== post.pos) {
		wg.dispatch({ selection: { anchor: endOfLastLine(post.pos + post.node.length) } });
	}

	refocusMedia(mediaId);
};

/** returns the file insertion index at the pointer, or the tile count to append. */
const getFileSlotAt = (grid: HTMLElement, x: number, y: number): number => {
	const rects = [...grid.querySelectorAll(`[${MEDIA_ID_ATTR}]`)].map((tile) => tile.getBoundingClientRect());

	// find the row first so drops after a wrapped row's last tile stay in that row.
	const rowTop = rects.find((rect) => y < rect.bottom)?.top;
	if (rowTop === undefined) {
		return rects.length;
	}

	const inRow = rects.flatMap((rect, index) => (rect.top === rowTop ? [{ rect, index }] : []));
	const before = inRow.find(({ rect }) => x < rect.left + rect.width / 2);
	return before?.index ?? inRow[inRow.length - 1]!.index + 1;
};

function MediaGrid({
	wg,
	dnd,
	postId,
	media,
	isActive,
}: {
	wg: Wordgard;
	dnd: ThreadDnd;
	postId: string;
	media: readonly PostMedia[];
	isActive: boolean;
}) {
	// insertion index for external files.
	const [slot, setSlot] = useState<number | null>(null);
	const roving = useRovingFocus(
		media.map((item) => item.id),
		isActive,
	);

	const gridRef = (node: HTMLElement | null) => {
		if (!node) {
			return;
		}

		// catches attachments dropped on the grid's padding rather than a tile.
		return dnd.dropTarget({
			element: node,
			canDrop: ({ source }) => source.data.kind === 'media',
			getData: () => ({ kind: 'mediaGrid', postId }),
		});
	};

	return (
		<div
			ref={gridRef}
			className={styles.grid}
			{...{ [MEDIA_GRID_ATTR]: '' }}
			onKeyDown={(event) => {
				escapeToEditor(wg, event);
				roving.onKeyDown(event);
			}}
			onDragOver={(event) => {
				if (!isFileDrag(event.dataTransfer)) {
					return;
				}
				event.preventDefault();
				event.stopPropagation();
				// show the grid's insertion line instead of the post outline.
				markDropTarget(wg, null);
				setSlot(getFileSlotAt(event.currentTarget, event.clientX, event.clientY));
			}}
			onDragLeave={(event) => {
				if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) {
					setSlot(null);
				}
			}}
			onDrop={(event) => {
				if (!isFileDrag(event.dataTransfer)) {
					return;
				}
				event.preventDefault();
				event.stopPropagation();
				setSlot(null);

				const at = getFileSlotAt(event.currentTarget, event.clientX, event.clientY);
				// copy files before the drop event expires.
				const files = [...event.dataTransfer.files];
				void createMedia(files).then((created) => insertMediaAt(wg, postId, at, created.media));
				// restore the caret, which does not redraw while the editor is blurred.
				wg.focus();
			}}
		>
			{media.map((item, index) => (
				<MediaTile
					key={item.id}
					wg={wg}
					dnd={dnd}
					postId={postId}
					index={index}
					item={item}
					roving={roving.item(item.id)}
					insertBefore={slot === index}
					insertAfter={slot === media.length && index === media.length - 1}
				/>
			))}
		</div>
	);
}

function MediaTile({
	wg,
	dnd,
	postId,
	index,
	item,
	roving,
	insertBefore,
	insertAfter,
}: {
	wg: Wordgard;
	dnd: ThreadDnd;
	postId: string;
	index: number;
	item: PostMedia;
	roving: RovingItemProps;
	insertBefore: boolean;
	insertAfter: boolean;
}) {
	const url = getMediaUrl(item);

	const remove = () => {
		// transfer focus only if the removed tile had it.
		const focused = document.activeElement?.closest(`[${MEDIA_ID_ATTR}]`)?.getAttribute(MEDIA_ID_ATTR);
		const post = findPostById(wg.state.doc, postId);
		const media = post ? getPostParam(post.node).media : [];
		const neighbor = media[index + 1] ?? media[index - 1];

		removeMedia(wg, postId, item.id);
		if (focused !== item.id) {
			return;
		}

		if (neighbor) {
			refocusMedia(neighbor.id);
		} else {
			wg.focus();
		}
	};

	const tileRef = (node: HTMLElement | null) => {
		if (!node) {
			return;
		}

		const stopDragging = dnd.draggable({
			element: node,
			getInitialData: () => ({ kind: 'media', postId, mediaId: item.id, index }),
		});

		const stopDropping = dnd.dropTarget({
			element: node,
			canDrop: ({ source }) => source.data.kind === 'media',
			getData: ({ element, input }) =>
				attachClosestEdge(
					{ kind: 'mediaTile', postId, index },
					{ allowedEdges: ['left', 'right'], element, input },
				),
		});

		return () => {
			stopDragging();
			stopDropping();
		};
	};

	return (
		<div
			ref={tileRef}
			{...roving}
			className={styles.tile}
			role="group"
			aria-label={MEDIA_LABELS[item.kind]}
			{...{
				[MEDIA_ID_ATTR]: item.id,
				[MEDIA_INSERT_BEFORE_ATTR]: insertBefore ? '' : undefined,
				[MEDIA_INSERT_AFTER_ATTR]: insertAfter ? '' : undefined,
			}}
			onKeyDown={(event) => {
				// preserve native keyboard handling in audio controls.
				if (event.target !== event.currentTarget) {
					return;
				}

				if (event.key === 'Backspace' || event.key === 'Delete') {
					event.preventDefault();
					remove();
					return;
				}

				if (!event.altKey) {
					return;
				}

				switch (event.key) {
					case 'ArrowLeft': {
						nudgeMedia(wg, postId, item.id, -1);
						refocusMedia(item.id);
						break;
					}
					case 'ArrowRight': {
						nudgeMedia(wg, postId, item.id, 1);
						refocusMedia(item.id);
						break;
					}
					case 'ArrowUp': {
						moveMediaUp(wg, postId, item.id);
						followMedia(wg, item.id);
						break;
					}
					case 'ArrowDown': {
						moveMediaDown(wg, postId, item.id);
						followMedia(wg, item.id);
						break;
					}
					default: {
						return;
					}
				}

				event.preventDefault();
				event.stopPropagation();
			}}
		>
			<MediaPreview item={item} url={url} tabbable={roving.tabIndex === 0} />

			<div className={styles.tileActions} onMouseDown={keepEditorFocus}>
				{/* Delete and Backspace remove the focused tile. */}
				<Button
					label={m['view.composer.media.removeAttachment']()}
					size="tiny"
					color="secondary_inverted"
					shape="round"
					tabIndex={-1}
					onClick={remove}
				>
					<ButtonIcon icon={XIcon} />
				</Button>
			</div>
		</div>
	);
}

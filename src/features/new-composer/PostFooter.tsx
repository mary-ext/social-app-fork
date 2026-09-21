import { type MouseEvent, useState } from 'react';

import { attachClosestEdge } from '@oomfware/tug/hitbox';

import type { Wordgard } from 'wordgard/editor';

import { openMediaPicker } from '#/lib/media/picker';
import type { AttachmentKind } from '#/lib/media/read-attachment';

import { toPostLanguages, usePostLanguage } from '#/state/preferences/languages';

import { getSelectionErrorMessage } from '#/features/composer/media/attachment-messages';

import { Text } from '#/components/Text';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import XIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import EmojiIcon from '#/icons/central/EmojiSmile_round_outlined_radius1_stroke2.svg';
import GifIcon from '#/icons/central/GifSquare_round_outlined_radius1_stroke2.svg';
import ImageIcon from '#/icons/central/Images1_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { CharCount } from './CharCount';
import { autoSplitPost } from './commands';
import { markDropTarget, type PostSummary } from './decorations';
import type { ThreadDnd } from './dnd';
import { isFileDrag } from './drag';
import {
	MEDIA_GRID_ATTR,
	MEDIA_ID_ATTR,
	MEDIA_INSERT_AFTER_ATTR,
	MEDIA_INSERT_BEFORE_ATTR,
} from './elements';
import {
	attachFiles,
	createMedia,
	getMediaUrl,
	insertMediaAt,
	moveMediaDown,
	moveMediaUp,
	nudgeMedia,
	removeMedia,
} from './media';
import * as styles from './PostFooter.css';
import type { PostMedia } from './schema';

// preserve editor focus for undo shortcuts. applying this to media tiles would cancel dragging.
const keepEditorFocus = (event: MouseEvent) => {
	event.preventDefault();
};

/**
 * media and editing controls for a post.
 *
 * @param props the editor, drag state, and post summary
 * @returns the post's footer
 */
export function PostFooter({ wg, dnd, post }: { wg: Wordgard; dnd: ThreadDnd; post: PostSummary }) {
	const languages = toPostLanguages(usePostLanguage());

	return (
		<div className={styles.root}>
			{post.media.length > 0 && <MediaGrid wg={wg} dnd={dnd} postId={post.id} media={post.media} />}

			{post.mediaProblem && (
				<Text size="md_sub" color="negative_600">
					{getSelectionErrorMessage(post.mediaProblem)}
				</Text>
			)}

			<div className={styles.toolbar} onMouseDown={keepEditorFocus}>
				<div className={styles.actions}>
					<Button
						label={m['common.compose.action.photo']()}
						variant="ghost"
						color="secondary"
						shape="round"
						onClick={() => {
							void openMediaPicker().then((files) => attachFiles(wg, post.id, files));
						}}
					>
						<ButtonIcon icon={ImageIcon} size="lg" />
					</Button>

					<Button
						label={m['view.composer.gif.a11y.select']()}
						variant="ghost"
						color="secondary"
						shape="round"
					>
						<ButtonIcon icon={GifIcon} size="lg" />
					</Button>

					<Button label={m['common.a11y.openEmojiPicker']()} variant="ghost" color="secondary" shape="round">
						<ButtonIcon icon={EmojiIcon} size="lg" />
					</Button>
				</div>

				<div className={styles.status}>
					{post.isOverLimit && (
						<Button
							label="Split into multiple posts"
							size="tiny"
							color="secondary"
							onClick={() => autoSplitPost(wg, post.id)}
						>
							<ButtonText>Auto-split</ButtonText>
						</Button>
					)}

					<Button
						className={styles.language}
						label={m['view.composer.language.selectPost']()}
						variant="ghost"
						color="secondary"
					>
						<ButtonText size="sm">{languages.join(', ')}</ButtonText>
					</Button>
					<CharCount count={post.length} />
				</div>
			</div>
		</div>
	);
}

const MEDIA_LABELS: Record<AttachmentKind, string> = {
	gif: 'GIF attachment',
	image: 'Image attachment',
	video: 'Video attachment',
	voice: 'Voice attachment',
};

function MediaPreview({ item, url }: { item: PostMedia; url: string }) {
	switch (item.kind) {
		case 'image': {
			return <img className={styles.media} src={url} alt="" />;
		}
		case 'voice': {
			return <audio className={styles.media} src={url} preload="metadata" controls />;
		}
		case 'gif':
		case 'video': {
			return <video className={styles.media} src={url} preload="metadata" muted />;
		}
	}
}

/** restores focus after a move replaces the tile, allowing repeated keyboard moves. */
const refocusMedia = (mediaId: string) => {
	requestAnimationFrame(() => {
		document.querySelector<HTMLElement>(`[${MEDIA_ID_ATTR}="${CSS.escape(mediaId)}"]`)?.focus();
	});
};

/** returns the insertion index for files dropped at the pointer, or the tile count for an append. */
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
}: {
	wg: Wordgard;
	dnd: ThreadDnd;
	postId: string;
	media: readonly PostMedia[];
}) {
	// insertion index for external files.
	const [slot, setSlot] = useState<number | null>(null);

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
				// a blurred editor redraws its content but not its caret; focusing restores it.
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
	insertBefore,
	insertAfter,
}: {
	wg: Wordgard;
	dnd: ThreadDnd;
	postId: string;
	index: number;
	item: PostMedia;
	insertBefore: boolean;
	insertAfter: boolean;
}) {
	const url = getMediaUrl(item);

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
			className={styles.tile}
			tabIndex={0}
			role="group"
			aria-label={MEDIA_LABELS[item.kind]}
			{...{
				[MEDIA_ID_ATTR]: item.id,
				[MEDIA_INSERT_BEFORE_ATTR]: insertBefore ? '' : undefined,
				[MEDIA_INSERT_AFTER_ATTR]: insertAfter ? '' : undefined,
			}}
			onKeyDown={(event) => {
				if (!event.altKey) {
					return;
				}

				switch (event.key) {
					case 'ArrowLeft': {
						nudgeMedia(wg, postId, item.id, -1);
						break;
					}
					case 'ArrowRight': {
						nudgeMedia(wg, postId, item.id, 1);
						break;
					}
					case 'ArrowUp': {
						moveMediaUp(wg, postId, item.id);
						break;
					}
					case 'ArrowDown': {
						moveMediaDown(wg, postId, item.id);
						break;
					}
					default: {
						return;
					}
				}

				refocusMedia(item.id);
				event.preventDefault();
				event.stopPropagation();
			}}
		>
			<MediaPreview item={item} url={url} />

			<div className={styles.tileActions} onMouseDown={keepEditorFocus}>
				<Button
					label={m['view.composer.media.removeAttachment']()}
					size="tiny"
					color="secondary_inverted"
					shape="round"
					onClick={() => removeMedia(wg, postId, item.id)}
				>
					<ButtonIcon icon={XIcon} />
				</Button>
			</div>
		</div>
	);
}

import type { CSSProperties } from 'react';

import { attachClosestEdge } from '@oomfware/tug/hitbox';

import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';
import type { Wordgard } from 'wordgard/editor';

import type { AttachmentKind } from '#/lib/media/read-attachment';

import { getTileStyle } from '#/components/ImageEmbed/carousel/strip';
import { ProgressCircle } from '#/components/ProgressCircle';
import { Spinner } from '#/components/Spinner';
import { Button } from '#/components/web/Button';

import CheckIcon from '#/icons/central/Checkmark2_round_outlined_radius1_stroke2.svg';
import XIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import PencilIcon from '#/icons/central/PencilLine_round_outlined_radius1_stroke2.svg';
import PlusIcon from '#/icons/central/PlusSmall_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import type { ThreadDnd } from '../dnd/channel';
import { endOfLastLine, findPostById, getPostParam, getPosts, type PostMedia } from '../editor/schema';
import { findActivePost } from '../editor/selection';
import {
	MEDIA_ID_ATTR,
	MEDIA_INSERT_AFTER_ATTR,
	MEDIA_INSERT_BEFORE_ATTR,
	MEDIA_ROW_ATTR,
} from '../elements';
import { keepEditorFocus, type RovingItemProps } from '../focus';
import * as overlay from '../overlay.css';
import { getMediaUrl } from './attachments';
import { moveMediaDown, moveMediaUp, nudgeMedia, removeMedia } from './commands';
import * as styles from './MediaTile.css';
import { type UploadStatus, useUploadStatus } from './upload-status';

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
					className={styles.audio}
					src={url}
					preload="metadata"
					controls
					// keep native controls out of the tab order unless their tile is tabbable.
					tabIndex={tabbable ? undefined : -1}
				/>
			);
		}
		case 'gif': {
			// GIFs remain images until publishing.
			return <img className={styles.frame} src={url} alt="" />;
		}
		case 'video': {
			return <video className={styles.frame} src={url} preload="metadata" muted />;
		}
	}
}

type PendingUpload = Exclude<UploadStatus, { status: 'done' }>;

const getUploadLabel = (upload: PendingUpload): string => {
	switch (upload.status) {
		case 'compressing': {
			return m['view.composer.media.upload.compressing']();
		}
		case 'uploading': {
			return m['view.composer.media.upload.uploading']({ percent: Math.round(upload.progress * 100) });
		}
		case 'processing': {
			return m['view.composer.media.upload.processing']();
		}
	}
};

function UploadBadge({ upload }: { upload: PendingUpload }) {
	return (
		<div className={styles.uploadBadge}>
			{upload.status === 'uploading' ? (
				<ProgressCircle
					color="white"
					progress={upload.progress}
					size={18}
					trackColor="rgba(255, 255, 255, 0.25)"
				/>
			) : (
				<Spinner label={null} size="md" />
			)}
			{getUploadLabel(upload)}
		</div>
	);
}

function AltButton({ item, tabbable }: { item: PostMedia; tabbable: boolean }) {
	const hasAlt = item.alt.length > 0;

	// TODO: open the alt text editor.
	return (
		<Button
			label={hasAlt ? m['view.composer.altText.action.edit']() : m['view.composer.altText.action.add']()}
			className={styles.altChip}
			variant="bare"
			tabIndex={tabbable ? undefined : -1}
			onMouseDown={keepEditorFocus}
		>
			{hasAlt ? (
				<CheckIcon className={clsx(overlay.overlayIcon, styles.altCheck)} />
			) : (
				<PlusIcon className={overlay.overlayIcon} />
			)}
			{hasAlt ? m['view.composer.altText.badge.done']() : m['view.composer.altText.badge.add']()}
		</Button>
	);
}

export type MediaLayout = 'grid' | 'single' | 'strip';

const getLayoutProps = (
	layout: MediaLayout,
	item: PostMedia,
): { className?: string; style?: CSSProperties } => {
	switch (layout) {
		case 'grid': {
			return { className: item.kind === 'image' ? styles.square : undefined };
		}
		case 'single': {
			return {
				className: styles.single,
				style: assignInlineVars({ [styles.ratioVar]: String(item.aspectRatio ?? 1) }),
			};
		}
		case 'strip': {
			return { className: styles.stripTile, style: getTileStyle(item.aspectRatio) };
		}
	}
};

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

/**
 * attachment tile with drag and keyboard controls.
 *
 * @param props attachment, layout, and editor interaction state
 * @returns the tile
 */
export function MediaTile({
	wg,
	dnd,
	postId,
	index,
	item,
	layout,
	roving,
	insertBefore,
	insertAfter,
}: {
	wg: Wordgard;
	dnd: ThreadDnd;
	postId: string;
	index: number;
	item: PostMedia;
	layout: MediaLayout;
	roving: RovingItemProps;
	insertBefore: boolean;
	insertAfter: boolean;
}) {
	const url = getMediaUrl(item);
	const isRow = item.kind !== 'image';
	const layoutProps = getLayoutProps(layout, item);
	const tabbable = roving.tabIndex === 0;

	const upload = useUploadStatus(item);
	const pendingUpload = upload && upload.status !== 'done' ? upload : null;

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
			// preserve native audio control interaction.
			canDrag: ({ input }) =>
				!(document.elementFromPoint(input.clientX, input.clientY) instanceof HTMLAudioElement),
			getInitialData: () => ({ kind: 'media', postId, mediaId: item.id, index }),
		});

		const stopDropping = dnd.dropTarget({
			element: node,
			canDrop: ({ source }) => source.data.kind === 'media',
			getData: ({ element, input }) =>
				attachClosestEdge(
					{ kind: 'mediaTile', postId, index },
					{ allowedEdges: isRow ? ['top', 'bottom'] : ['left', 'right'], element, input },
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
			className={clsx(styles.tile, layoutProps.className, item.kind === 'voice' && styles.voice)}
			style={layoutProps.style}
			role="group"
			aria-label={MEDIA_LABELS[item.kind]}
			{...{
				[MEDIA_ID_ATTR]: item.id,
				[MEDIA_ROW_ATTR]: isRow ? '' : undefined,
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
			<MediaPreview item={item} url={url} tabbable={tabbable} />

			{pendingUpload ? <UploadBadge upload={pendingUpload} /> : <AltButton item={item} tabbable={tabbable} />}

			<div className={styles.tileActions} onMouseDown={keepEditorFocus}>
				{item.kind === 'image' && (
					// TODO: open the image editor.
					<Button
						label={m['view.composer.gallery.action.edit']()}
						className={overlay.overlayButton}
						variant="bare"
						tabIndex={tabbable ? undefined : -1}
					>
						<PencilIcon className={overlay.overlayIcon} />
					</Button>
				)}

				{/* Delete and Backspace remove the focused tile. */}
				<Button
					label={
						pendingUpload
							? m['view.composer.media.cancelUpload']()
							: m['view.composer.media.removeAttachment']()
					}
					className={overlay.overlayButton}
					variant="bare"
					tabIndex={-1}
					onClick={remove}
				>
					<XIcon className={overlay.overlayIcon} />
				</Button>
			</div>
		</div>
	);
}

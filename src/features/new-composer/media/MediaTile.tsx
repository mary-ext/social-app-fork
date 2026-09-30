import { type CSSProperties, type ReactNode, useState } from 'react';

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
import PlayIcon from '#/icons/central/Play_round_filled_radius1_stroke2.svg';
import PlusIcon from '#/icons/central/PlusSmall_round_outlined_radius1_stroke2.svg';
import VideoIcon from '#/icons/central/VideoClip_round_outlined_radius3_stroke1.svg';
import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import type { ThreadDnd } from '../dnd/channel';
import { DragChip, DragThumbnail, setDragPreview } from '../dnd/DragPreview';
import { endOfLastLine, findPostById, getPostParam, getPosts, type PostMedia } from '../editor/schema';
import { findActivePost } from '../editor/selection';
import { getMediaTileSelector, MEDIA_ID_ATTR } from '../elements';
import { keepEditorFocus, type RovingItemProps } from '../focus';
import * as overlay from '../overlay.css';
import { getMediaUrl } from './attachments';
import { moveMediaDown, moveMediaUp, nudgeMedia, removeMedia } from './commands';
import * as styles from './MediaTile.css';
import { type UploadStatus, useUploadStatus } from './upload-status';
import { VoicePlayer } from './VoicePlayer';

const MEDIA_LABELS: Record<AttachmentKind, string> = {
	gif: 'GIF attachment',
	image: 'Image attachment',
	video: 'Video attachment',
	voice: 'Voice attachment',
};

const getMediaDragPreview = (item: PostMedia, url: string): ReactNode => {
	switch (item.kind) {
		case 'image':
		case 'gif': {
			return <DragThumbnail src={url} />;
		}
		case 'video': {
			return <DragChip icon={VideoIcon} label={MEDIA_LABELS.video} />;
		}
		case 'voice': {
			return <DragChip icon={PlayIcon} label={MEDIA_LABELS.voice} />;
		}
	}
};

function MediaPreview({ item, url, tabbable }: { item: PostMedia; url: string; tabbable: boolean }) {
	switch (item.kind) {
		case 'image': {
			return <img className={styles.media} src={url} alt="" />;
		}
		case 'voice': {
			return <VoicePlayer item={item} url={url} tabbable={tabbable} />;
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

type ControlStyles = {
	actions: string;
	altChip: string;
	progressColor: string;
	removeButton: string;
	spinnerColor: 'default' | 'white';
	trackColor: string;
	uploadBadge: string;
};

const OVERLAY_CONTROLS: ControlStyles = {
	actions: styles.tileActions,
	altChip: styles.altChip,
	progressColor: 'white',
	removeButton: overlay.overlayButton,
	spinnerColor: 'white',
	trackColor: 'rgba(255, 255, 255, 0.25)',
	uploadBadge: styles.uploadBadge,
};

const INLINE_CONTROLS: ControlStyles = {
	actions: styles.inlineTileActions,
	altChip: styles.inlineAltChip,
	progressColor: colors.primary_500,
	removeButton: styles.inlineButton,
	spinnerColor: 'default',
	trackColor: colors.borderContrastLow,
	uploadBadge: styles.inlineUploadStatus,
};

function UploadBadge({ upload, controls }: { upload: PendingUpload; controls: ControlStyles }) {
	return (
		<div className={controls.uploadBadge}>
			{upload.status === 'uploading' ? (
				<ProgressCircle
					color={controls.progressColor}
					progress={upload.progress}
					size={18}
					trackColor={controls.trackColor}
				/>
			) : (
				<Spinner color={controls.spinnerColor} label={null} size="md" />
			)}
			{getUploadLabel(upload)}
		</div>
	);
}

function AltButton({
	item,
	controls,
	tabbable,
}: {
	item: PostMedia;
	controls: ControlStyles;
	tabbable: boolean;
}) {
	const hasAlt = item.alt.length > 0;

	// TODO: open the alt text editor.
	return (
		<Button
			label={hasAlt ? m['view.composer.altText.action.edit']() : m['view.composer.altText.action.add']()}
			className={controls.altChip}
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

// images use single or strip; other attachments use full-width stack rows.
type MediaLayout = 'single' | 'stack' | 'strip';

const getLayoutProps = (
	layout: MediaLayout,
	item: PostMedia,
): { className?: string; style?: CSSProperties } => {
	// single and strip layouts only hold images.
	const aspectRatio = item.kind === 'image' ? item.aspectRatio : undefined;

	switch (layout) {
		case 'single': {
			return {
				className: styles.single,
				style: assignInlineVars({ [styles.ratioVar]: String(aspectRatio ?? 1) }),
			};
		}
		case 'stack': {
			return {};
		}
		case 'strip': {
			return { className: styles.stripTile, style: getTileStyle(aspectRatio) };
		}
	}
};

// moves replace the tile; restore focus so keyboard moves can repeat.
const refocusMedia = (mediaId: string) => {
	requestAnimationFrame(() => {
		document.querySelector<HTMLElement>(getMediaTileSelector(mediaId))?.focus();
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
}: {
	wg: Wordgard;
	dnd: ThreadDnd;
	postId: string;
	index: number;
	item: PostMedia;
	layout: MediaLayout;
	roving: RovingItemProps;
}) {
	const [isDragging, setIsDragging] = useState(false);
	const url = getMediaUrl(item);
	const controls = item.kind === 'voice' ? INLINE_CONTROLS : OVERLAY_CONTROLS;
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

		return dnd.draggable({
			element: node,
			getInitialData: () => ({ kind: 'media', postId, mediaId: item.id, mediaKind: item.kind, index }),
			onGenerateDragPreview: ({ nativeSetDragImage }) => {
				setDragPreview(nativeSetDragImage, getMediaDragPreview(item, url));
			},
			onDragStart: () => setIsDragging(true),
			onDrop: () => setIsDragging(false),
		});
	};

	return (
		<div
			ref={tileRef}
			{...roving}
			className={clsx(
				styles.tile,
				layoutProps.className,
				item.kind === 'voice' && styles.voice,
				isDragging && styles.dragging,
			)}
			style={layoutProps.style}
			role="group"
			aria-label={MEDIA_LABELS[item.kind]}
			{...{ [MEDIA_ID_ATTR]: item.id }}
			onKeyDown={(event) => {
				// preserve keyboard handling in the tile's controls.
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

			{pendingUpload ? (
				<UploadBadge upload={pendingUpload} controls={controls} />
			) : (
				<AltButton item={item} controls={controls} tabbable={tabbable} />
			)}

			<div className={controls.actions} onMouseDown={keepEditorFocus}>
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
					className={controls.removeButton}
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

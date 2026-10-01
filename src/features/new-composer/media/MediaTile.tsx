import { type CSSProperties, type ReactNode, useState } from 'react';

import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import type { AttachmentKind } from '#/lib/media/read-attachment';
import { getBlobUrl } from '#/lib/utils/blob-url';

import { getTileStyle } from '#/components/ImageEmbed/carousel/strip';
import { getAspectRatio } from '#/components/ImageEmbed/carousel/utils';
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

import { useComposer, useEditorState } from '../context';
import { DragChip, DragThumbnail, setDragPreview } from '../dnd/DragPreview';
import { findPostById, getPostParam, type PostMedia } from '../editor/schema';
import { getMediaTileSelector, MEDIA_ID_ATTR } from '../elements';
import { keepEditorFocus, type RovingItemProps } from '../focus';
import * as overlay from '../overlay.css';
import { hasMediaAlt } from './alt-text';
import { getMediaUrl } from './attachments';
import { moveMediaDown, moveMediaUp, nudgeMedia, removeMedia } from './commands';
import { getEditedImage, getImageEdit } from './image-edits';
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
	hasAlt,
	controls,
	tabbable,
	onClick,
}: {
	hasAlt: boolean;
	controls: ControlStyles;
	tabbable: boolean;
	onClick: () => void;
}) {
	return (
		<Button
			label={hasAlt ? m['view.composer.altText.action.edit']() : m['view.composer.altText.action.add']()}
			className={controls.altChip}
			variant="bare"
			tabIndex={tabbable ? undefined : -1}
			onMouseDown={keepEditorFocus}
			onClick={onClick}
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
	aspectRatio: number | undefined,
): { className?: string; style?: CSSProperties } => {
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

/**
 * attachment tile with drag and keyboard controls.
 *
 * @param props attachment location, layout, and focus and editing controls
 * @returns the tile
 */
export function MediaTile({
	postId,
	index,
	item,
	layout,
	roving,
	onEditAlt,
	onEditImage,
}: {
	postId: string;
	index: number;
	item: PostMedia;
	layout: MediaLayout;
	roving: RovingItemProps;
	onEditAlt: () => void;
	/** omit for attachments that can't be edited. */
	onEditImage?: () => void;
}) {
	const { wg, dnd } = useComposer();
	const hasAlt = useEditorState((state) => hasMediaAlt(state, item.id));
	const edit = useEditorState((state) => getImageEdit(state, item.id));
	const [isDragging, setIsDragging] = useState(false);
	const image = item.kind === 'image' ? getEditedImage(item, edit) : null;
	const url = image ? getBlobUrl(image.blob) : getMediaUrl(item);
	const controls = item.kind === 'voice' ? INLINE_CONTROLS : OVERLAY_CONTROLS;
	const layoutProps = getLayoutProps(layout, getAspectRatio(image?.dimensions));
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
						refocusMedia(item.id);
						break;
					}
					case 'ArrowDown': {
						moveMediaDown(wg, postId, item.id);
						refocusMedia(item.id);
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
				<AltButton hasAlt={hasAlt} controls={controls} tabbable={tabbable} onClick={onEditAlt} />
			)}

			<div className={controls.actions} onMouseDown={keepEditorFocus}>
				{onEditImage && (
					<Button
						label={m['view.composer.gallery.action.edit']()}
						className={overlay.overlayButton}
						variant="bare"
						tabIndex={tabbable ? undefined : -1}
						onClick={onEditImage}
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

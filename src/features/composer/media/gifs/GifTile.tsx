import { assignInlineVars } from '@vanilla-extract/dynamic';

import { getBlobUrl } from '#/lib/utils/blob-url';

import { m } from '#/paraglide/messages';

import { useEditorState } from '../../context';
import { DragThumbnail } from '../../dnd/DragPreview';
import type { PostMedia } from '../../model/schema';
import type { RovingItemProps } from '../../shared/roving-focus';
import { hasMediaAlt } from '../alt-text/alt-text';
import { MediaTile } from '../tile/MediaTile';
import { AltButton, RemoveButton, TileActions, TileBadges, TileUploadStatus } from '../tile/TileControls';
import { useVideoUpload } from '../uploads/upload-status';
import { isPendingUpload } from '../uploads/video-uploads';
import * as css from './GifTile.css';

/**
 * local GIF attachment tile.
 *
 * @param props attachment and interaction controls
 * @returns the tile
 */
export function GifTile({
	postId,
	index,
	item,
	roving,
	onEditAlt,
	onRemove,
}: {
	postId: string;
	index: number;
	item: Extract<PostMedia, { kind: 'gif' }>;
	roving: RovingItemProps;
	onEditAlt: () => void;
	onRemove: () => void;
}) {
	const hasAlt = useEditorState((state) => hasMediaAlt(state, item.id));
	const upload = useVideoUpload(item.file);
	const url = getBlobUrl(item.file);
	const tabbable = roving.tabIndex === 0;

	return (
		<MediaTile
			postId={postId}
			index={index}
			item={item}
			label={m['features.composer.media.a11y.gif']()}
			dragPreview={<DragThumbnail src={url} />}
			roving={roving}
			className={css.tile}
			style={assignInlineVars({ [css.ratioVar]: String(item.aspectRatio ?? 1) })}
			onRemove={onRemove}
		>
			<img className={css.image} src={url} alt="" />

			<TileUploadStatus file={item.file} upload={upload} tabbable={tabbable} />

			<TileBadges>
				<AltButton hasAlt={hasAlt} tabbable={tabbable} onClick={onEditAlt} />
			</TileBadges>

			<TileActions>
				<RemoveButton isUploading={isPendingUpload(upload)} onClick={onRemove} />
			</TileActions>
		</MediaTile>
	);
}

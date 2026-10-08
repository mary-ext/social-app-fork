import { assignInlineVars } from '@vanilla-extract/dynamic';

import { getBlobUrl } from '#/lib/utils/blob-url';

import { hasMediaAlt } from '#/features/composer/media/alt-text';

import { getVideoBoxRatio } from '#/components/Post/Embed/media-constants';
import { useCompositeItem } from '#/components/primitives/composite';

import { m } from '#/paraglide/messages';

import { useEditorState } from '../../context';
import { DragThumbnail } from '../../dnd/DragPreview';
import type { PostMedia } from '../../model/schema';
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
	onEditAlt,
	onRemove,
}: {
	postId: string;
	index: number;
	item: Extract<PostMedia, { kind: 'gif' }>;
	onEditAlt: () => void;
	onRemove: () => void;
}) {
	const hasAlt = useEditorState((state) => hasMediaAlt(state, item.id));
	const upload = useVideoUpload(item.file);
	const url = getBlobUrl(item.file);
	const composite = useCompositeItem({ active: false, disabled: false });
	const tabbable = composite?.tabIndex === 0;

	return (
		<MediaTile
			postId={postId}
			index={index}
			item={item}
			label={m['features.composer.media.a11y.gif']()}
			dragPreview={<DragThumbnail src={url} />}
			composite={composite}
			className={css.tile}
			style={assignInlineVars({ [css.ratioVar]: String(getVideoBoxRatio(item.aspectRatio)) })}
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

import { getBlobUrl } from '#/lib/utils/blob-url';

import { useEditorState } from '../context';
import { DragThumbnail } from '../dnd/DragPreview';
import type { PostMedia } from '../model/schema';
import type { RovingItemProps } from '../shared/roving-focus';
import { hasMediaAlt } from './alt-text';
import * as css from './GifTile.css';
import { MediaTile } from './MediaTile';
import { AltButton, RemoveButton, TileActions, TileBadges, UploadBadge } from './TileControls';
import { usePendingUpload } from './upload-status';

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
	const upload = usePendingUpload(item.file);
	const url = getBlobUrl(item.file);
	const tabbable = roving.tabIndex === 0;

	return (
		<MediaTile
			postId={postId}
			index={index}
			item={item}
			label="GIF attachment"
			dragPreview={<DragThumbnail src={url} />}
			roving={roving}
			onRemove={onRemove}
		>
			<img className={css.image} src={url} alt="" />

			<TileBadges>
				{upload ? (
					<UploadBadge upload={upload} />
				) : (
					<AltButton hasAlt={hasAlt} tabbable={tabbable} onClick={onEditAlt} />
				)}
			</TileBadges>

			<TileActions>
				<RemoveButton isUploading={!!upload} onClick={onRemove} />
			</TileActions>
		</MediaTile>
	);
}

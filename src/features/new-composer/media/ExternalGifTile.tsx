import { assignInlineVars } from '@vanilla-extract/dynamic';

import { gifPreviewUrl } from '#/features/gifPicker/utils';

import { useEditorState } from '../context';
import { DragThumbnail } from '../dnd/DragPreview';
import type { PostMedia } from '../editor/schema';
import type { RovingItemProps } from '../focus';
import { hasMediaAlt } from './alt-text';
import * as css from './ExternalGifTile.css';
import { MediaTile } from './MediaTile';
import { AltButton, RemoveButton, TileActions } from './TileControls';

/**
 * GIF picker attachment tile.
 *
 * @param props attachment and interaction controls
 * @returns the tile
 */
export function ExternalGifTile({
	postId,
	index,
	item,
	roving,
	onEditAlt,
	onRemove,
}: {
	postId: string;
	index: number;
	item: Extract<PostMedia, { kind: 'externalGif' }>;
	roving: RovingItemProps;
	onEditAlt: () => void;
	onRemove: () => void;
}) {
	const hasAlt = useEditorState((state) => hasMediaAlt(state, item.id));
	const url = gifPreviewUrl(item.gif.media_formats.gif.url);
	const tabbable = roving.tabIndex === 0;

	return (
		<MediaTile
			postId={postId}
			index={index}
			item={item}
			label="GIF attachment"
			dragPreview={<DragThumbnail src={url} />}
			roving={roving}
			className={css.tile}
			style={assignInlineVars({ [css.ratioVar]: String(item.aspectRatio ?? 1) })}
			onRemove={onRemove}
		>
			<img className={css.image} src={url} alt="" />

			<AltButton hasAlt={hasAlt} tabbable={tabbable} onClick={onEditAlt} />

			<TileActions>
				<RemoveButton isUploading={false} onClick={onRemove} />
			</TileActions>
		</MediaTile>
	);
}

import { getBlobUrl } from '#/lib/utils/blob-url';

import VideoIcon from '#/icons/central/VideoClip_round_outlined_radius3_stroke1.svg';

import { useEditorState } from '../context';
import { DragChip } from '../dnd/DragPreview';
import type { PostMedia } from '../editor/schema';
import type { RovingItemProps } from '../focus';
import { hasMediaAlt } from './alt-text';
import { MediaTile } from './MediaTile';
import { AltButton, RemoveButton, TileActions, UploadBadge } from './TileControls';
import { usePendingUpload } from './upload-status';
import * as css from './VideoTile.css';

const LABEL = 'Video attachment';

/**
 * video attachment tile.
 *
 * @param props attachment and interaction controls
 * @returns the tile
 */
export function VideoTile({
	postId,
	index,
	item,
	roving,
	onEditAlt,
	onRemove,
}: {
	postId: string;
	index: number;
	item: Extract<PostMedia, { kind: 'video' }>;
	roving: RovingItemProps;
	onEditAlt: () => void;
	onRemove: () => void;
}) {
	const hasAlt = useEditorState((state) => hasMediaAlt(state, item.id));
	const upload = usePendingUpload(item.id);
	const tabbable = roving.tabIndex === 0;

	return (
		<MediaTile
			postId={postId}
			index={index}
			item={item}
			label={LABEL}
			dragPreview={<DragChip icon={VideoIcon} label={LABEL} />}
			roving={roving}
			onRemove={onRemove}
		>
			<video className={css.video} src={getBlobUrl(item.file)} preload="metadata" muted />

			{upload ? (
				<UploadBadge upload={upload} />
			) : (
				<AltButton hasAlt={hasAlt} tabbable={tabbable} onClick={onEditAlt} />
			)}

			<TileActions>
				<RemoveButton isUploading={!!upload} onClick={onRemove} />
			</TileActions>
		</MediaTile>
	);
}

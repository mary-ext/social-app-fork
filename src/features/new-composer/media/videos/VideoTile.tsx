import { getBlobUrl } from '#/lib/utils/blob-url';

import VideoIcon from '#/icons/central/VideoClip_round_outlined_radius3_stroke1.svg';

import { useEditorState } from '../../context';
import { DragChip } from '../../dnd/DragPreview';
import type { PostMedia } from '../../model/schema';
import type { RovingItemProps } from '../../shared/roving-focus';
import { hasMediaAlt } from '../shared/alt-text';
import { MediaTile } from '../shared/MediaTile';
import {
	AltButton,
	CaptionsButton,
	RemoveButton,
	TileActions,
	TileBadges,
	TileUploadStatus,
} from '../shared/TileControls';
import { useVideoUpload } from '../shared/upload-status';
import { isPendingUpload } from '../shared/video-uploads';
import { hasMediaCaptions } from './captions';
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
	onEditCaptions,
	onRemove,
}: {
	postId: string;
	index: number;
	item: Extract<PostMedia, { kind: 'video' }>;
	roving: RovingItemProps;
	onEditAlt: () => void;
	onEditCaptions: () => void;
	onRemove: () => void;
}) {
	const hasAlt = useEditorState((state) => hasMediaAlt(state, item.id));
	const hasCaptions = useEditorState((state) => hasMediaCaptions(state, item.id));
	const upload = useVideoUpload(item.file);
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

			<TileUploadStatus file={item.file} upload={upload} tabbable={tabbable} />

			<TileBadges>
				<AltButton hasAlt={hasAlt} tabbable={tabbable} onClick={onEditAlt} />
				<CaptionsButton hasCaptions={hasCaptions} tabbable={tabbable} onClick={onEditCaptions} />
			</TileBadges>

			<TileActions>
				<RemoveButton isUploading={isPendingUpload(upload)} onClick={onRemove} />
			</TileActions>
		</MediaTile>
	);
}

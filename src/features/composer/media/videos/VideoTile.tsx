import { assignInlineVars } from '@vanilla-extract/dynamic';

import { getBlobUrl } from '#/lib/utils/blob-url';

import { hasMediaAlt } from '#/features/composer/media/alt-text';

import { getVideoBoxRatio } from '#/components/Post/Embed/media-constants';
import { useCompositeItem } from '#/components/primitives/composite';

import VideoIcon from '#/icons/central/VideoClip_round_outlined_radius3_stroke1.svg';
import { m } from '#/paraglide/messages';

import { useEditorState } from '../../context';
import { DragChip } from '../../dnd/DragPreview';
import type { PostMedia } from '../../model/schema';
import { MediaTile } from '../tile/MediaTile';
import {
	AltButton,
	CaptionsButton,
	RemoveButton,
	TileActions,
	TileBadges,
	TileUploadStatus,
} from '../tile/TileControls';
import { useVideoUpload } from '../uploads/upload-status';
import { isPendingUpload } from '../uploads/video-uploads';
import { hasMediaCaptions } from './captions';
import * as css from './VideoTile.css';

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
	onEditAlt,
	onEditCaptions,
	onRemove,
}: {
	postId: string;
	index: number;
	item: Extract<PostMedia, { kind: 'video' }>;
	onEditAlt: () => void;
	onEditCaptions: () => void;
	onRemove: () => void;
}) {
	const hasAlt = useEditorState((state) => hasMediaAlt(state, item.id));
	const hasCaptions = useEditorState((state) => hasMediaCaptions(state, item.id));
	const upload = useVideoUpload(item.file);
	const composite = useCompositeItem({ active: false, disabled: false });
	const tabbable = composite?.tabIndex === 0;
	const label = m['features.composer.media.a11y.video']();

	return (
		<MediaTile
			postId={postId}
			index={index}
			item={item}
			label={label}
			dragPreview={<DragChip icon={VideoIcon} label={label} />}
			composite={composite}
			className={css.tile}
			style={assignInlineVars({ [css.ratioVar]: String(getVideoBoxRatio(item.aspectRatio)) })}
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

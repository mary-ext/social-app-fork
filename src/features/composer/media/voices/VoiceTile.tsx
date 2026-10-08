import { hasMediaAlt } from '#/features/composer/media/alt-text';

import { useCompositeItem } from '#/components/primitives/composite';

import PlayIcon from '#/icons/central/Play_round_filled_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { useEditorState } from '../../context';
import { DragChip } from '../../dnd/DragPreview';
import type { VoiceMedia } from '../../model/schema';
import { MediaTile } from '../tile/MediaTile';
import { AltButton, RemoveButton, TileActions, TileUploadStatus } from '../tile/TileControls';
import { useVideoUpload } from '../uploads/upload-status';
import { isPendingUpload } from '../uploads/video-uploads';
import { VoicePlayer } from './VoicePlayer';
import * as css from './VoiceTile.css';

/**
 * voice attachment tile with a seekable waveform.
 *
 * @param props attachment and interaction controls
 * @returns the tile
 */
export function VoiceTile({
	postId,
	index,
	item,
	onEditAlt,
	onRemove,
}: {
	postId: string;
	index: number;
	item: VoiceMedia;
	onEditAlt: () => void;
	onRemove: () => void;
}) {
	const hasAlt = useEditorState((state) => hasMediaAlt(state, item.id));
	const upload = useVideoUpload(item.file);
	const composite = useCompositeItem({ active: false, disabled: false });
	const tabbable = composite?.tabIndex === 0;
	const label = m['features.composer.media.a11y.voice']();

	return (
		<MediaTile
			postId={postId}
			index={index}
			item={item}
			label={label}
			dragPreview={<DragChip icon={PlayIcon} label={label} />}
			composite={composite}
			className={css.tile}
			onRemove={onRemove}
		>
			<VoicePlayer className={css.player} item={item} tabbable={tabbable} />

			{/* inline tiles have room for one badge. */}
			<TileUploadStatus variant="inline" file={item.file} upload={upload} tabbable={tabbable}>
				<AltButton variant="inline" hasAlt={hasAlt} tabbable={tabbable} onClick={onEditAlt} />
			</TileUploadStatus>

			<TileActions variant="inline">
				<RemoveButton variant="inline" isUploading={isPendingUpload(upload)} onClick={onRemove} />
			</TileActions>
		</MediaTile>
	);
}

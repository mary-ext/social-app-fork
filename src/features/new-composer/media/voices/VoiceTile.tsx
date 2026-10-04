import PlayIcon from '#/icons/central/Play_round_filled_radius1_stroke2.svg';

import { useEditorState } from '../../context';
import { DragChip } from '../../dnd/DragPreview';
import type { VoiceMedia } from '../../model/schema';
import type { RovingItemProps } from '../../shared/roving-focus';
import { hasMediaAlt } from '../shared/alt-text';
import { MediaTile } from '../shared/MediaTile';
import { AltButton, RemoveButton, TileActions, TileUploadStatus } from '../shared/TileControls';
import { useVideoUpload } from '../shared/upload-status';
import { isPendingUpload } from '../shared/video-uploads';
import { VoicePlayer } from './VoicePlayer';
import * as css from './VoiceTile.css';

const LABEL = 'Voice attachment';

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
	roving,
	onEditAlt,
	onRemove,
}: {
	postId: string;
	index: number;
	item: VoiceMedia;
	roving: RovingItemProps;
	onEditAlt: () => void;
	onRemove: () => void;
}) {
	const hasAlt = useEditorState((state) => hasMediaAlt(state, item.id));
	const upload = useVideoUpload(item.file);
	const tabbable = roving.tabIndex === 0;

	return (
		<MediaTile
			postId={postId}
			index={index}
			item={item}
			label={LABEL}
			dragPreview={<DragChip icon={PlayIcon} label={LABEL} />}
			roving={roving}
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

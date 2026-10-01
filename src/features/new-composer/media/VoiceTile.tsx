import PlayIcon from '#/icons/central/Play_round_filled_radius1_stroke2.svg';

import { useEditorState } from '../context';
import { DragChip } from '../dnd/DragPreview';
import type { PostMedia } from '../model/schema';
import type { RovingItemProps } from '../shared/roving-focus';
import { hasMediaAlt } from './alt-text';
import { MediaTile } from './MediaTile';
import { AltButton, RemoveButton, TileActions, UploadBadge } from './TileControls';
import { usePendingUpload } from './upload-status';
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
	item: Extract<PostMedia, { kind: 'voice' }>;
	roving: RovingItemProps;
	onEditAlt: () => void;
	onRemove: () => void;
}) {
	const hasAlt = useEditorState((state) => hasMediaAlt(state, item.id));
	const upload = usePendingUpload(item.file);
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
			<VoicePlayer item={item} tabbable={tabbable} />

			{upload ? (
				<UploadBadge variant="inline" upload={upload} />
			) : (
				<AltButton variant="inline" hasAlt={hasAlt} tabbable={tabbable} onClick={onEditAlt} />
			)}

			<TileActions variant="inline">
				<RemoveButton variant="inline" isUploading={!!upload} onClick={onRemove} />
			</TileActions>
		</MediaTile>
	);
}

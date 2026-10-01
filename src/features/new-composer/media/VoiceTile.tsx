import { getBlobUrl } from '#/lib/utils/blob-url';

import { ProgressCircle } from '#/components/ProgressCircle';
import { Spinner } from '#/components/Spinner';

import PlayIcon from '#/icons/central/Play_round_filled_radius1_stroke2.svg';
import { colors } from '#/styles/colors';

import { useEditorState } from '../context';
import { DragChip } from '../dnd/DragPreview';
import type { PostMedia } from '../editor/schema';
import type { RovingItemProps } from '../focus';
import { hasMediaAlt } from './alt-text';
import { MediaTile } from './MediaTile';
import { AltButton, RemoveButton, TileActions } from './TileControls';
import { getUploadLabel, usePendingUpload } from './upload-status';
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
	const upload = usePendingUpload(item.id);
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
			<VoicePlayer item={item} url={getBlobUrl(item.file)} tabbable={tabbable} />

			{upload ? (
				<div className={css.uploadStatus}>
					{upload.status === 'uploading' ? (
						<ProgressCircle
							color={colors.primary_500}
							progress={upload.progress}
							size={18}
							trackColor={colors.borderContrastLow}
						/>
					) : (
						<Spinner label={null} size="md" />
					)}
					{getUploadLabel(upload)}
				</div>
			) : (
				<AltButton className={css.altChip} hasAlt={hasAlt} tabbable={tabbable} onClick={onEditAlt} />
			)}

			<TileActions className={css.tileActions}>
				<RemoveButton className={css.button} isUploading={!!upload} onClick={onRemove} />
			</TileActions>
		</MediaTile>
	);
}

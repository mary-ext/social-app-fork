import type { CSSProperties } from 'react';

import { assignInlineVars } from '@vanilla-extract/dynamic';

import { getBlobUrl } from '#/lib/utils/blob-url';

import { getTileStyle } from '#/components/ImageEmbed/carousel/strip';
import { getAspectRatio } from '#/components/ImageEmbed/carousel/utils';
import { Button } from '#/components/web/Button';

import PencilIcon from '#/icons/central/PencilLine_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { useEditorState } from '../context';
import { DragThumbnail } from '../dnd/DragPreview';
import type { ImageMedia } from '../editor/schema';
import type { RovingItemProps } from '../focus';
import * as overlay from '../overlay.css';
import { hasMediaAlt } from './alt-text';
import { getEditedImage, getImageEdit } from './image-edits';
import * as css from './ImageTile.css';
import { MediaTile } from './MediaTile';
import { AltButton, TileActions, RemoveButton } from './TileControls';
import * as controls from './TileControls.css';

type ImageLayout = 'single' | 'strip';

const getLayoutProps = (
	layout: ImageLayout,
	aspectRatio: number | undefined,
): { className: string; style: CSSProperties } => {
	switch (layout) {
		case 'single': {
			return {
				className: css.single,
				style: assignInlineVars({ [css.ratioVar]: String(aspectRatio ?? 1) }),
			};
		}
		case 'strip': {
			return { className: css.stripTile, style: getTileStyle(aspectRatio) };
		}
	}
};

/**
 * image attachment in the feed's single-image or carousel layout.
 *
 * @param props image, layout, and interaction controls
 * @returns the tile
 */
export function ImageTile({
	postId,
	index,
	item,
	layout,
	roving,
	onEditAlt,
	onEditImage,
	onRemove,
}: {
	postId: string;
	index: number;
	item: ImageMedia;
	layout: ImageLayout;
	roving: RovingItemProps;
	onEditAlt: () => void;
	/** omit for images that can't be edited. */
	onEditImage?: () => void;
	onRemove: () => void;
}) {
	const hasAlt = useEditorState((state) => hasMediaAlt(state, item.id));
	const edit = useEditorState((state) => getImageEdit(state, item.id));
	const image = getEditedImage(item, edit);
	const url = getBlobUrl(image.blob);
	const aspectRatio = getAspectRatio(image.dimensions);
	const tabbable = roving.tabIndex === 0;

	return (
		<MediaTile
			postId={postId}
			index={index}
			item={item}
			label="Image attachment"
			dragPreview={<DragThumbnail src={url} />}
			roving={roving}
			{...getLayoutProps(layout, aspectRatio)}
			onRemove={onRemove}
		>
			<img className={css.image} src={url} alt="" />

			<AltButton
				className={controls.overlayAltChip}
				hasAlt={hasAlt}
				tabbable={tabbable}
				onClick={onEditAlt}
			/>

			<TileActions className={controls.overlayActions}>
				{onEditImage && (
					<Button
						label={m['view.composer.gallery.action.edit']()}
						className={overlay.overlayButton}
						variant="bare"
						tabIndex={tabbable ? undefined : -1}
						onClick={onEditImage}
					>
						<PencilIcon className={overlay.overlayIcon} />
					</Button>
				)}
				<RemoveButton className={overlay.overlayButton} isUploading={false} onClick={onRemove} />
			</TileActions>
		</MediaTile>
	);
}

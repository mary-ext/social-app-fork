import type { CSSProperties } from 'react';

import { assignInlineVars } from '@vanilla-extract/dynamic';

import { getBlobUrl } from '#/lib/utils/blob-url';

import { hasMediaAlt } from '#/features/composer/media/alt-text';

import { getTileStyle } from '#/components/ImageEmbed/carousel/strip';
import { getAspectRatio } from '#/components/ImageEmbed/carousel/utils';
import { useCompositeItem } from '#/components/primitives/composite';

import PencilIcon from '#/icons/central/PencilLine_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { useEditorState } from '../../context';
import { DragThumbnail } from '../../dnd/DragPreview';
import type { ImageMedia } from '../../model/schema';
import { MediaTile } from '../tile/MediaTile';
import { AltButton, RemoveButton, TileActions, TileBadges, TileButton } from '../tile/TileControls';
import { getEditedImage, getImageEdit } from './image-edits';
import * as css from './ImageTile.css';

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
	onEditAlt,
	onEditImage,
	onRemove,
}: {
	postId: string;
	index: number;
	item: ImageMedia;
	layout: ImageLayout;
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
	const composite = useCompositeItem({ active: false, disabled: false });
	const tabbable = composite?.tabIndex === 0;

	return (
		<MediaTile
			postId={postId}
			index={index}
			item={item}
			label={m['features.composer.media.a11y.image']()}
			dragPreview={<DragThumbnail src={url} />}
			composite={composite}
			{...getLayoutProps(layout, aspectRatio)}
			onRemove={onRemove}
		>
			<img className={css.image} src={url} alt="" />

			<TileBadges>
				<AltButton hasAlt={hasAlt} tabbable={tabbable} onClick={onEditAlt} />
			</TileBadges>

			<TileActions>
				{onEditImage && (
					<TileButton
						label={m['features.composer.media.action.editImage']()}
						icon={PencilIcon}
						tabbable={tabbable}
						onClick={onEditImage}
					/>
				)}
				<RemoveButton isUploading={false} onClick={onRemove} />
			</TileActions>
		</MediaTile>
	);
}

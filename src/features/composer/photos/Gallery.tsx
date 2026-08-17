import type { FocusEvent } from 'react';

import { assignInlineVars } from '@vanilla-extract/dynamic';

import type { ComposerImage } from '#/lib/media/composer-image';
import { getBlobUrl } from '#/lib/utils/blob-url';

import * as Dialog from '#/components/Dialog';
import { EditImageDialog } from '#/components/EditImageDialog/EditImageDialog';
import { CAROUSEL_MAX_HEIGHT, CAROUSEL_MIN_HEIGHT } from '#/components/ImageEmbed/carousel/const';
import { computeDims, getAspectRatio, getCarouselMetrics } from '#/components/ImageEmbed/carousel/utils';
import { useGalleryBleed } from '#/components/images/Gallery';
import { Text } from '#/components/Text';

import CheckIcon from '#/icons/central/Checkmark2_round_outlined_radius1_stroke2.svg';
import CircleInfoIcon from '#/icons/central/CircleInfo_round_outlined_radius1_stroke2.svg';
import TimesIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import PencilIcon from '#/icons/central/PencilLine_round_outlined_radius1_stroke2.svg';
import PlusIcon from '#/icons/central/PlusLarge_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import type { PostAction } from '../state/composer';
import type { AltTextContext } from './alt-text-generator/types';
import * as styles from './Gallery.css';
import { ImageAltTextDialog } from './ImageAltTextDialog';

type GalleryProps = {
	dispatch: (action: PostAction) => void;
	images: ComposerImage[];
	/** The post text, which reaches the description assistant as context for what it can't see. */
	text: string;
};

export function Gallery({ dispatch, images, text }: GalleryProps) {
	if (images.length === 0) {
		return null;
	}

	const showReminder = images.some((image) => !image.alt);

	return (
		<>
			{images.length === 1 ? (
				<SingleImage dispatch={dispatch} image={images[0]!} text={text} />
			) : (
				<Carousel dispatch={dispatch} images={images} text={text} />
			)}
			{showReminder && (
				<div className={styles.reminder}>
					<CircleInfoIcon className={styles.reminderIcon} />
					<Text className={styles.reminderText} color="textContrastMedium" size="md_sub">
						{m['view.composer.altText.hint']()}
					</Text>
				</div>
			)}
		</>
	);
}

const SingleImage = ({
	dispatch,
	image,
	text,
}: {
	dispatch: (action: PostAction) => void;
	image: ComposerImage;
	text: string;
}) => {
	const aspectRatio = getAspectRatio(image.transformed ?? image.source);

	return (
		<div className={styles.single} style={assignInlineVars({ [styles.ratioVar]: String(aspectRatio ?? 1) })}>
			<ItemChrome
				context={toAltTextContext([image], 0, text)}
				image={image}
				onChange={(next) => {
					dispatch({ type: 'embedUpdateImage', image: next });
				}}
				onRemove={() => {
					dispatch({ type: 'embedRemoveImage', image });
				}}
			/>
		</div>
	);
};

// keep the full tile visible when focus moves between its controls
const onFocus = (evt: FocusEvent<HTMLDivElement>) => {
	const tile = (evt.target as HTMLElement).closest('[data-composer-image]');
	tile?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
};

const Carousel = ({ dispatch, images, text }: GalleryProps) => {
	const { bleedStyle, bleedWidth, insetLeft, insetRight, ref: bleedRef } = useGalleryBleed();

	const { contentHeight, paddingRight } = getCarouselMetrics({
		bleedWidth,
		insetLeft,
		insetRight,
		max: CAROUSEL_MAX_HEIGHT,
		min: CAROUSEL_MIN_HEIGHT,
		ratios: images.map((image) => getAspectRatio(image.transformed ?? image.source)),
	});

	return (
		<div ref={bleedRef} className={styles.root} style={{ height: contentHeight }}>
			<div
				className={styles.scroll}
				onFocus={onFocus}
				role="group"
				aria-label={m['components.post.image.a11y.gallery']({ count: images.length })}
				style={{ ...bleedStyle, paddingRight }}
			>
				{images.map((image, index) => (
					<GalleryItem
						key={image.source.id}
						contentHeight={contentHeight}
						context={toAltTextContext(images, index, text)}
						image={image}
						onChange={(next) => {
							dispatch({ type: 'embedUpdateImage', image: next });
						}}
						onRemove={() => {
							dispatch({ type: 'embedRemoveImage', image });
						}}
					/>
				))}
			</div>
		</div>
	);
};

const toAltTextContext = (images: ComposerImage[], index: number, text: string): AltTextContext => ({
	siblingAlts: images.filter((_, idx) => idx !== index).map((sibling) => sibling.alt),
	text: text,
});

type GalleryItemProps = {
	contentHeight: number;
	context: AltTextContext;
	image: ComposerImage;
	onChange: (next: ComposerImage) => void;
	onRemove: () => void;
};

const GalleryItem = ({ contentHeight, context, image, onChange, onRemove }: GalleryItemProps) => {
	const aspectRatio = getAspectRatio(image.transformed ?? image.source);
	const dims = computeDims({ aspectRatio, height: contentHeight });

	return (
		<div className={styles.item} data-composer-image style={{ height: dims.height, width: dims.width }}>
			<ItemChrome context={context} image={image} onChange={onChange} onRemove={onRemove} />
		</div>
	);
};

type ItemChromeProps = {
	context: AltTextContext;
	image: ComposerImage;
	onChange: (next: ComposerImage) => void;
	onRemove: () => void;
};

const ItemChrome = ({ context, image, onChange, onRemove }: ItemChromeProps) => {
	const imageUrl = getBlobUrl((image.transformed ?? image.source).blob);

	const altTextHandle = Dialog.useDialogHandle();
	const editHandle = Dialog.useDialogHandle();

	const hasAlt = image.alt.length !== 0;

	return (
		<>
			<img className={styles.image} src={imageUrl} alt={image.alt} draggable={false} />
			<Dialog.Trigger
				handle={altTextHandle}
				className={styles.altBadge}
				aria-label={m['view.composer.altText.action.add']()}
			>
				{hasAlt ? (
					<CheckIcon className={styles.altBadgeIcon} />
				) : (
					<PlusIcon className={styles.altBadgeIcon} />
				)}
				<Text className={styles.altBadgeLabel} color="white" size="sm" weight="semiBold">
					{m['common.altText.badge']()}
				</Text>
			</Dialog.Trigger>
			<div className={styles.controls}>
				<Dialog.Trigger
					handle={editHandle}
					className={styles.control}
					aria-label={m['view.composer.gallery.action.edit']()}
				>
					<PencilIcon className={styles.pencilIcon} />
				</Dialog.Trigger>
				<button
					type="button"
					className={styles.control}
					onClick={onRemove}
					aria-label={m['view.composer.gallery.action.remove']()}
				>
					<TimesIcon className={styles.timesIcon} />
				</button>
			</div>
			<ImageAltTextDialog context={context} handle={altTextHandle} image={image} onChange={onChange} />
			<EditImageDialog handle={editHandle} image={image} onChange={onChange} />
		</>
	);
};

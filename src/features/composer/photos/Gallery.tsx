import { useCallback, useEffect, useRef } from 'react';

import { assignInlineVars } from '@vanilla-extract/dynamic';

import { useBlobUrl } from '#/lib/blob-url';
import type { ComposerImage } from '#/lib/media/composer-image';

import * as Dialog from '#/components/Dialog';
import { EditImageDialog } from '#/components/EditImageDialog/EditImageDialog';
import {
	CAROUSEL_MAX_HEIGHT,
	CAROUSEL_MIN_HEIGHT,
	CAROUSEL_PEEK,
	ITEM_GAP,
} from '#/components/ImageEmbed/carousel/const';
import { usePointerHandlers } from '#/components/ImageEmbed/carousel/usePointerHandlers';
import { computeDims, deriveCarouselHeight, getAspectRatio } from '#/components/ImageEmbed/carousel/utils';
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

/** A lone composer image: no scroller, no bleed — it sizes to the content column at its own aspect ratio. */
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
					dispatch({ type: 'embed_update_image', image: next });
				}}
				onRemove={() => {
					dispatch({ type: 'embed_remove_image', image });
				}}
			/>
		</div>
	);
};

// Tabbing lands on a control button inside a tile; bring the whole tile into view rather than leaving the
// browser to reveal just the focused corner.
const onFocus = (evt: React.FocusEvent<HTMLDivElement>) => {
	const tile = (evt.target as HTMLElement).closest('[data-composer-image]');
	tile?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
};

const Carousel = ({ dispatch, images, text }: GalleryProps) => {
	const { bleedStyle, bleedWidth, insetLeft, ref: bleedRef } = useGalleryBleed();

	// every tile sits `insetLeft` in from the strip's left edge; reserve the gap plus a sliver of the next so it
	// peeks.
	const maxItemWidth = Math.max(0, bleedWidth - insetLeft - ITEM_GAP - CAROUSEL_PEEK);
	// One shared row height for the whole strip, shrunk so the widest tile fits `maxItemWidth` uncropped.
	const contentHeight = deriveCarouselHeight({
		max: CAROUSEL_MAX_HEIGHT,
		maxWidth: maxItemWidth,
		min: CAROUSEL_MIN_HEIGHT,
		ratios: images.map((image) => getAspectRatio(image.transformed ?? image.source)),
	});

	const scrollRef = useRef<HTMLDivElement>(null);
	const itemWidthsRef = useRef<Map<number, number>>(new Map());
	const currentIndexRef = useRef(0);

	const getScrollEl = useCallback(() => scrollRef.current, []);
	const scrollTo = useCallback((offset: number) => {
		if (scrollRef.current) {
			scrollRef.current.scrollLeft = offset;
		}
	}, []);
	// Tiles aren't the focus target here (each holds its own controls), so settling only tracks the index for
	// the pager's drag math — it must not steal focus the way the read-only carousel does.
	const onSettle = useCallback((index: number) => {
		currentIndexRef.current = index;
	}, []);
	const onWidthChange = useCallback((index: number, w: number) => {
		itemWidthsRef.current.set(index, w);
	}, []);

	usePointerHandlers({
		currentIndexRef,
		getScrollEl,
		imageCount: images.length,
		itemWidthsRef,
		onSettle,
		scrollTo,
	});

	return (
		<div ref={bleedRef} className={styles.root} style={{ height: contentHeight }}>
			<div
				ref={scrollRef}
				className={styles.scroll}
				onFocus={onFocus}
				role="group"
				aria-label={m['components.post.image.a11y.gallery']({ count: images.length })}
				style={bleedStyle}
			>
				{images.map((image, index) => (
					<GalleryItem
						key={image.source.id}
						contentHeight={contentHeight}
						context={toAltTextContext(images, index, text)}
						image={image}
						index={index}
						onChange={(next) => {
							dispatch({ type: 'embed_update_image', image: next });
						}}
						onRemove={() => {
							dispatch({ type: 'embed_remove_image', image });
						}}
						onWidthChange={onWidthChange}
					/>
				))}
			</div>
		</div>
	);
};

/** what the description assistant is told about the image beyond the pixels: the post, and its siblings. */
const toAltTextContext = (images: ComposerImage[], index: number, text: string): AltTextContext => ({
	siblingAlts: images.filter((_, idx) => idx !== index).map((sibling) => sibling.alt),
	text: text,
});

type GalleryItemProps = {
	contentHeight: number;
	context: AltTextContext;
	image: ComposerImage;
	index: number;
	onChange: (next: ComposerImage) => void;
	onRemove: () => void;
	onWidthChange: (index: number, width: number) => void;
};

const GalleryItem = ({
	contentHeight,
	context,
	image,
	index,
	onChange,
	onRemove,
	onWidthChange,
}: GalleryItemProps) => {
	const aspectRatio = getAspectRatio(image.transformed ?? image.source);
	const dims = computeDims({ aspectRatio, height: contentHeight });

	useEffect(() => {
		onWidthChange(index, dims.width);
	}, [index, dims.width, onWidthChange]);

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

/** The image plus its editing overlay (ALT badge, edit/remove controls) and the dialogs those open. */
const ItemChrome = ({ context, image, onChange, onRemove }: ItemChromeProps) => {
	const imageUrl = useBlobUrl((image.transformed ?? image.source).blob);

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

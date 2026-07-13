import { useCallback, useEffect, useRef } from 'react';

import { assignInlineVars } from '@vanilla-extract/dynamic';

import { useBlobUrl } from '#/lib/hooks/useBlobUrl';

import type { ComposerImage } from '#/state/gallery';

import * as Dialog from '#/components/Dialog';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon } from '#/components/icons/CircleInfo';
import { Pencil_Stroke2_Corner0_Rounded as PencilIcon } from '#/components/icons/Pencil';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { TimesLarge_Stroke2_Corner0_Rounded as TimesIcon } from '#/components/icons/Times';
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

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import type { PostAction } from '../state/composer';
import { EditImageDialog } from './EditImageDialog';
import * as styles from './Gallery.css';
import { ImageAltTextDialog } from './ImageAltTextDialog';

type GalleryProps = {
	dispatch: (action: PostAction) => void;
	images: ComposerImage[];
};

export function Gallery({ dispatch, images }: GalleryProps) {
	if (images.length === 0) {
		return null;
	}

	const showReminder = images.some((image) => !image.alt);

	return (
		<>
			{images.length === 1 ? (
				<SingleImage dispatch={dispatch} image={images[0]!} />
			) : (
				<Carousel dispatch={dispatch} images={images} />
			)}

			{showReminder && (
				<div className={styles.reminder}>
					<CircleInfoIcon className={styles.reminderIcon} size="md" fill={colors.textContrastMedium} />
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
}: {
	dispatch: (action: PostAction) => void;
	image: ComposerImage;
}) => {
	const aspectRatio = getAspectRatio(image.transformed ?? image.source);

	return (
		<div className={styles.single} style={assignInlineVars({ [styles.ratioVar]: String(aspectRatio ?? 1) })}>
			<ItemChrome
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

const Carousel = ({ dispatch, images }: GalleryProps) => {
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

type GalleryItemProps = {
	contentHeight: number;
	image: ComposerImage;
	index: number;
	onChange: (next: ComposerImage) => void;
	onRemove: () => void;
	onWidthChange: (index: number, width: number) => void;
};

const GalleryItem = ({
	contentHeight,
	image,
	index,
	onChange,
	onRemove,
	onWidthChange,
}: GalleryItemProps) => {
	const aspectRatio = getAspectRatio(image.transformed ?? image.source);
	const { isCropped: _isCropped, ...dims } = computeDims({ aspectRatio, height: contentHeight });

	useEffect(() => {
		onWidthChange(index, dims.width);
	}, [index, dims.width, onWidthChange]);

	return (
		<div className={styles.item} data-composer-image style={{ height: dims.height, width: dims.width }}>
			<ItemChrome image={image} onChange={onChange} onRemove={onRemove} />
		</div>
	);
};

type ItemChromeProps = {
	image: ComposerImage;
	onChange: (next: ComposerImage) => void;
	onRemove: () => void;
};

/** The image plus its editing overlay (ALT badge, edit/remove controls) and the dialogs those open. */
const ItemChrome = ({ image, onChange, onRemove }: ItemChromeProps) => {
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
				{hasAlt ? <CheckIcon width={10} fill="currentColor" /> : <PlusIcon width={10} fill="currentColor" />}
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
					<PencilIcon size="xs" fill="currentColor" />
				</Dialog.Trigger>
				<button
					type="button"
					className={styles.control}
					onClick={onRemove}
					aria-label={m['view.composer.gallery.action.remove']()}
				>
					<TimesIcon size="sm" fill="currentColor" />
				</button>
			</div>

			<ImageAltTextDialog handle={altTextHandle} image={image} onChange={onChange} />
			<EditImageDialog handle={editHandle} image={image} onChange={onChange} />
		</>
	);
};

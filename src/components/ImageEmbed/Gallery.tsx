import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppBskyEmbedImages } from '@atcute/bluesky';
import { useLingui } from '@lingui/react/macro';
import type { LightboxImage } from '@oomfware/lightbox';
import { clsx } from 'clsx';

import type { LightboxControl } from '#/components/dialogs/Context';
import {
	CAROUSEL_CHAT_MAX_HEIGHT,
	CAROUSEL_CHAT_MIN_HEIGHT,
	CAROUSEL_MAX_HEIGHT,
	CAROUSEL_MIN_HEIGHT,
	CAROUSEL_PEEK,
	ITEM_GAP,
} from '#/components/ImageEmbed/carousel/const';
import { useKeyboardHandlers } from '#/components/ImageEmbed/carousel/useKeyboardHandlers';
import { usePointerHandlers } from '#/components/ImageEmbed/carousel/usePointerHandlers';
import { computeDims, deriveCarouselHeight, getAspectRatio } from '#/components/ImageEmbed/carousel/utils';
import * as styles from '#/components/ImageEmbed/Gallery.css';
import { MediaBadges } from '#/components/ImageEmbed/MediaBadges';
import { useGalleryBleed } from '#/components/images/Gallery';
import { PostEmbedViewContext } from '#/components/Post/Embed/types';
import * as Dialog from '#/components/web/Dialog';

import { useLargeAltBadgeEnabled } from '#/storage/hooks/large-alt-badge';

export type GalleryProps = {
	images: AppBskyEmbedImages.ViewImage[];
	/**
	 * Lightbox handle + the full lib image list; each slide is a detached `Dialog.Trigger` opening at its
	 * index.
	 */
	control: LightboxControl;
	lightboxImages: LightboxImage[];
	onPressIn?: () => void;
	viewContext?: PostEmbedViewContext;
};

export function Gallery({ images, control, lightboxImages, onPressIn, viewContext }: GalleryProps) {
	const { t: l } = useLingui();
	const [largeAltBadge] = useLargeAltBadgeEnabled();
	const isWithinQuote = viewContext === PostEmbedViewContext.FeedEmbedRecordWithMedia;
	const isWithinChat = viewContext === PostEmbedViewContext.ChatMessage;
	const hideBadges = isWithinQuote;
	// Bleed overflow: measure this strip's offset within the GalleryBleed ancestor (by diffing bounding
	// rects) so it can extend past the post's content column.
	const { bleedRef, bleedWidth } = useGalleryBleed();
	const contentRef = useRef<HTMLDivElement>(null);
	const [contentDims, setContentDims] = useState<{ x: number; width: number }>();

	const width = bleedWidth || Math.min(600, window.innerWidth);
	const insetLeft = contentDims?.x ?? 0;
	const insetRight = bleedWidth > 0 ? bleedWidth - (contentDims?.x ?? 0) - (contentDims?.width ?? 0) : 0;
	// Width budget for the widest tile: every snapped tile sits `insetLeft` in from the strip's left edge (the
	// text column), so the room to the right viewport edge is `width - insetLeft`; reserve the inter-tile gap
	// plus a sliver of the next image so it peeks.
	const maxItemWidth = Math.max(0, width - insetLeft - ITEM_GAP - CAROUSEL_PEEK);

	// One row height for the whole strip: an orientation base from the first two images (chat bubbles map onto
	// a more compact range), shrunk so the widest tile fits `maxItemWidth` uncropped and the next peeks. Items
	// then take their own clamped width within it.
	const contentHeight = deriveCarouselHeight({
		max: isWithinChat ? CAROUSEL_CHAT_MAX_HEIGHT : CAROUSEL_MAX_HEIGHT,
		maxWidth: maxItemWidth,
		min: isWithinChat ? CAROUSEL_CHAT_MIN_HEIGHT : CAROUSEL_MIN_HEIGHT,
		ratios: images.map((image) => getAspectRatio(image.aspectRatio)),
	});

	// `useEffect`, not `useLayoutEffect`: the bleed element is an ancestor, so its ref attaches after this
	// descendant's layout phase. Measuring post-commit (and re-running when `bleedWidth` settles) sees it.
	useEffect(() => {
		const measure = () => {
			const bleedEl = bleedRef.current;
			if (contentRef.current && bleedEl) {
				const c = contentRef.current.getBoundingClientRect();
				const b = bleedEl.getBoundingClientRect();
				setContentDims({ x: c.left - b.left, width: c.width });
			}
		};
		measure();
		window.addEventListener('resize', measure);
		return () => window.removeEventListener('resize', measure);
	}, [bleedRef, bleedWidth, contentHeight]);

	const scrollRef = useRef<HTMLDivElement>(null);
	const itemWidthsRef = useRef<Map<number, number>>(new Map());
	const itemRefsRef = useRef<Map<number, HTMLElement>>(new Map());
	const currentIndexRef = useRef(0);

	const getScrollEl = useCallback(() => scrollRef.current, []);
	const scrollTo = useCallback((offset: number) => {
		if (scrollRef.current) {
			scrollRef.current.scrollLeft = offset;
		}
	}, []);

	const onSettle = useCallback((index: number) => {
		currentIndexRef.current = index;
		// Only the active image is tab-focusable
		itemRefsRef.current.forEach((node, i) => {
			node.tabIndex = i === index ? 0 : -1;
		});
		itemRefsRef.current.get(index)?.focus({ preventScroll: true });
	}, []);

	const onWidthChange = useCallback((index: number, w: number) => {
		itemWidthsRef.current.set(index, w);
	}, []);

	const setItemRef = useCallback((index: number, node: HTMLElement | null) => {
		if (node) {
			itemRefsRef.current.set(index, node);
		} else {
			itemRefsRef.current.delete(index);
		}
	}, []);

	useKeyboardHandlers({
		getScrollEl,
		itemWidthsRef,
		currentIndexRef,
		scrollTo,
		onSettle,
		imageCount: images.length,
	});
	usePointerHandlers({
		getScrollEl,
		itemWidthsRef,
		currentIndexRef,
		scrollTo,
		onSettle,
		imageCount: images.length,
	});

	return (
		<div ref={contentRef} className={styles.root} style={{ height: contentHeight }}>
			<div
				ref={scrollRef}
				role="group"
				aria-roledescription={l`carousel`}
				aria-label={l`Image gallery, ${images.length} images`}
				className={styles.scroll}
				style={{
					marginLeft: -insetLeft,
					paddingLeft: insetLeft,
					paddingRight: insetRight,
					width,
				}}
			>
				{images.map((image, index) => (
					<GalleryImage
						key={image.thumb + index}
						image={image}
						index={index}
						imageCount={images.length}
						contentHeight={contentHeight}
						hideBadges={hideBadges}
						largeAltBadge={largeAltBadge}
						onWidthChange={onWidthChange}
						setItemRef={setItemRef}
						control={control}
						lightboxImages={lightboxImages}
						onPressIn={onPressIn}
					/>
				))}
			</div>
		</div>
	);
}

function GalleryImage({
	image,
	index,
	imageCount,
	contentHeight,
	hideBadges,
	largeAltBadge,
	onWidthChange,
	setItemRef,
	control,
	lightboxImages,
	onPressIn,
}: {
	image: AppBskyEmbedImages.ViewImage;
	index: number;
	imageCount: number;
	contentHeight: number;
	hideBadges: boolean;
	largeAltBadge: boolean;
	onWidthChange: (index: number, width: number) => void;
	setItemRef: (index: number, node: HTMLElement | null) => void;
	control: LightboxControl;
	lightboxImages: LightboxImage[];
	onPressIn?: () => void;
}) {
	const { t: l } = useLingui();
	// Size from the declared aspect ratio only (a missing one defaults to square). The shared row height was
	// derived against these same metadata ratios, so adopting an image's true ratio post-load could push a
	// metadata-less tile past the width budget and swallow the peek — better a square placeholder.
	const aspectRatio = getAspectRatio(image.aspectRatio);
	const { isCropped, ...dims } = computeDims({ aspectRatio, height: contentHeight });
	const hasAlt = !!image.alt;
	// With a known ratio the tile matches it (cover fills cleanly; a clamped panorama is intentionally cropped,
	// flagged by `isCropped`). With an unknown ratio the tile is a blind square, so letterbox rather than chop.
	const isContain = aspectRatio === undefined;

	useEffect(() => {
		onWidthChange(index, dims.width);
	}, [index, dims.width, onWidthChange]);

	return (
		<Dialog.Trigger
			handle={control}
			payload={{ images: lightboxImages, index }}
			type="button"
			ref={(node: HTMLElement | null) => setItemRef(index, node)}
			className={styles.item}
			// Size the tile itself (border-box) so its on-screen width matches `dims.width` — the value the pager
			// sums for snap offsets. Letting the image's intrinsic width drive it instead leaves the tile a
			// border-width wider than `dims.width`, drifting the snap anchor by that much per image.
			style={{ height: dims.height, width: dims.width }}
			tabIndex={index === 0 ? 0 : -1}
			aria-roledescription={l`slide`}
			aria-label={image.alt || l`Image ${index + 1} of ${imageCount}`}
			onPointerDown={onPressIn}
		>
			<img
				className={clsx(styles.image, isContain && styles.imageContain)}
				src={image.thumb}
				alt={image.alt}
				loading={index === 0 ? 'eager' : 'lazy'}
			/>
			{!hideBadges && (
				<MediaBadges
					variant="gallery"
					hasAlt={hasAlt}
					cropped={isCropped}
					large={largeAltBadge}
					count={imageCount}
					index={index}
				/>
			)}
		</Dialog.Trigger>
	);
}

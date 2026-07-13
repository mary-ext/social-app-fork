import { useCallback, useEffect, useRef, useState } from 'react';

import type { AppBskyEmbedGallery } from '@atcute/bluesky';

import type { LightboxImage } from '@oomfware/lightbox';

import { clsx } from 'clsx';

import * as Dialog from '#/components/Dialog';
import type { LightboxHandle } from '#/components/dialogs/Context';
import { Image_Stroke2_Corner0_Rounded as ImageIcon } from '#/components/icons/Image';
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

import { m } from '#/paraglide/messages';
import { useLargeAltBadgeEnabled } from '#/storage/hooks/large-alt-badge';

export type GalleryProps = {
	images: AppBskyEmbedGallery.ViewImage[];
	/**
	 * Lightbox handle + the full lib image list; each slide is a detached `Dialog.Trigger` opening at its
	 * index.
	 */
	handle: LightboxHandle;
	lightboxImages: LightboxImage[];
	onPressIn?: () => void;
	viewContext?: PostEmbedViewContext;
};

export function Gallery({ images, handle, lightboxImages, onPressIn, viewContext }: GalleryProps) {
	const [largeAltBadge] = useLargeAltBadgeEnabled();
	const isWithinChat = viewContext === PostEmbedViewContext.ChatMessage;
	const { bleedStyle, bleedWidth, insetLeft, ref: bleedRef } = useGalleryBleed();

	// every snapped tile sits `insetLeft` in from the strip's left edge, so the room to the right viewport edge
	// is `bleedWidth - insetLeft`; reserve the gap plus a sliver of the next image so it peeks.
	const maxItemWidth = Math.max(0, bleedWidth - insetLeft - ITEM_GAP - CAROUSEL_PEEK);

	// One row height for the whole strip: an orientation base from the first two images (chat bubbles map onto
	// a more compact range), shrunk so the widest tile fits `maxItemWidth` uncropped and the next peeks. Items
	// then take their own clamped width within it.
	const contentHeight = deriveCarouselHeight({
		max: isWithinChat ? CAROUSEL_CHAT_MAX_HEIGHT : CAROUSEL_MAX_HEIGHT,
		maxWidth: maxItemWidth,
		min: isWithinChat ? CAROUSEL_CHAT_MIN_HEIGHT : CAROUSEL_MIN_HEIGHT,
		ratios: images.map((image) => getAspectRatio(image.aspectRatio)),
	});

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

	const setItemRef = (index: number, node: HTMLElement | null) => {
		if (node) {
			itemRefsRef.current.set(index, node);
		} else {
			itemRefsRef.current.delete(index);
		}
	};

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
		<div ref={bleedRef} className={styles.root} style={{ height: contentHeight }}>
			<div
				ref={scrollRef}
				role="group"
				aria-roledescription={m['components.post.image.a11y.carousel']()}
				aria-label={m['components.post.image.a11y.gallery']({ count: images.length })}
				className={styles.scroll}
				style={bleedStyle}
			>
				{images.map((image, index) => (
					<GalleryImage
						key={image.thumbnail + index}
						image={image}
						index={index}
						imageCount={images.length}
						contentHeight={contentHeight}
						largeAltBadge={largeAltBadge}
						onWidthChange={onWidthChange}
						setItemRef={setItemRef}
						handle={handle}
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
	largeAltBadge,
	onWidthChange,
	setItemRef,
	handle,
	lightboxImages,
	onPressIn,
}: {
	image: AppBskyEmbedGallery.ViewImage;
	index: number;
	imageCount: number;
	contentHeight: number;
	largeAltBadge: boolean;
	onWidthChange: (index: number, width: number) => void;
	setItemRef: (index: number, node: HTMLElement | null) => void;
	handle: LightboxHandle;
	lightboxImages: LightboxImage[];
	onPressIn?: () => void;
}) {
	const [status, setStatus] = useState<'error' | 'loaded' | 'loading'>(image.thumbnail ? 'loading' : 'error');

	const measure = useCallback((node: HTMLImageElement | null) => {
		if (node?.complete) {
			setStatus(node.naturalWidth > 0 ? 'loaded' : 'error');
		}
	}, []);

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
			handle={handle}
			payload={{ images: lightboxImages, index }}
			type="button"
			ref={(node: HTMLElement | null) => setItemRef(index, node)}
			className={styles.item}
			// Size the tile itself (border-box) so its on-screen width matches `dims.width` — the value the pager
			// sums for snap offsets. Letting the image's intrinsic width drive it instead leaves the tile a
			// border-width wider than `dims.width`, drifting the snap anchor by that much per image.
			style={{ height: dims.height, width: dims.width }}
			tabIndex={index === 0 ? 0 : -1}
			aria-roledescription={m['components.post.image.a11y.slide']()}
			aria-label={
				image.alt || m['components.post.image.a11y.imagePosition']({ index: index + 1, imageCount })
			}
			onPointerDown={onPressIn}
		>
			{status === 'error' ? (
				<span className={styles.fallback}>
					<ImageIcon fill="currentColor" size="3xl" />
				</span>
			) : (
				<img
					className={clsx(
						styles.image,
						isContain && styles.imageContain,
						status === 'loading' && styles.loading,
					)}
					src={image.thumbnail}
					alt={image.alt}
					loading={index === 0 ? 'eager' : 'lazy'}
					onError={() => setStatus('error')}
					onLoad={() => setStatus('loaded')}
					ref={measure}
				/>
			)}
			<MediaBadges
				variant="gallery"
				hasAlt={hasAlt}
				cropped={isCropped}
				large={largeAltBadge}
				count={imageCount}
				index={index}
			/>
		</Dialog.Trigger>
	);
}

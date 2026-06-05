import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppBskyEmbedImages } from '@atcute/bluesky';
import { useLingui } from '@lingui/react/macro';
import type { LightboxImage } from '@oomfware/lightbox';

import type { LightboxControl } from '#/components/dialogs/Context';
import { useGalleryBleed } from '#/components/images/Gallery';
import { PostEmbedViewContext } from '#/components/Post/Embed/types';
import * as Dialog from '#/components/web/Dialog';
import { useKeyboardHandlers } from '#/components/web/ImageEmbed/carousel/useKeyboardHandlers';
import { usePointerHandlers } from '#/components/web/ImageEmbed/carousel/usePointerHandlers';
import { computeDims, getAspectRatio } from '#/components/web/ImageEmbed/carousel/utils';
import * as styles from '#/components/web/ImageEmbed/Gallery.css';
import { MediaBadges } from '#/components/web/ImageEmbed/MediaBadges';
import { MediaInsetBorder } from '#/components/web/MediaInsetBorder';

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

/** Resolve the carousel's content height from the viewport width, matching the RNW breakpoint heights. */
function useContentHeight(isWithinChat: boolean) {
	const [height, setHeight] = useState(() => measureContentHeight(isWithinChat));
	useEffect(() => {
		if (isWithinChat) {
			setHeight(120);
			return;
		}
		const update = () => setHeight(measureContentHeight(false));
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, [isWithinChat]);
	return height;
}

function measureContentHeight(isWithinChat: boolean) {
	if (isWithinChat) {
		return 120;
	}
	if (window.innerWidth >= 800) {
		return 300;
	} else if (window.innerWidth >= 500) {
		return 260;
	} else {
		return 200;
	}
}

export function Gallery({ images, control, lightboxImages, onPressIn, viewContext }: GalleryProps) {
	const { t: l } = useLingui();
	const [largeAltBadge] = useLargeAltBadgeEnabled();
	const isWithinQuote = viewContext === PostEmbedViewContext.FeedEmbedRecordWithMedia;
	const isWithinChat = viewContext === PostEmbedViewContext.ChatMessage;
	const hideBadges = isWithinQuote;
	const contentHeight = useContentHeight(isWithinChat);

	// Bleed overflow: measure this strip's offset within the GalleryBleed ancestor so it can extend past the
	// post's content column. The RNW version uses `measureLayout`; on the DOM we diff bounding rects.
	const { bleedRef, bleedWidth } = useGalleryBleed();
	const contentRef = useRef<HTMLDivElement>(null);
	const [contentDims, setContentDims] = useState<{ x: number; width: number }>();
	// `useEffect`, not `useLayoutEffect`: the bleed element is an ancestor, so its ref attaches after this
	// descendant's layout phase. Measuring post-commit (and re-running when `bleedWidth` settles) sees it.
	useEffect(() => {
		const measure = () => {
			const bleedEl = bleedRef.current as unknown as HTMLElement | null;
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

	const width = bleedWidth || Math.min(600, window.innerWidth);
	const insetLeft = contentDims?.x ?? 0;
	const insetRight = bleedWidth > 0 ? bleedWidth - (contentDims?.x ?? 0) - (contentDims?.width ?? 0) : 0;

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
	const [focused, setFocused] = useState(false);
	const [aspectRatio, setAspectRatio] = useState(() => getAspectRatio(image.aspectRatio));
	const { isCropped, ...dims } = computeDims({ height: contentHeight, aspectRatio });
	const hasAlt = !!image.alt;

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
			tabIndex={index === 0 ? 0 : -1}
			aria-roledescription={l`slide`}
			aria-label={image.alt || l`Image ${index + 1} of ${imageCount}`}
			// scope the press to the lightbox; don't bubble to an ancestor post link. the Trigger owns the open,
			// so only stop propagation (preventDefault could suppress Base UI's open).
			onClick={(e) => e.stopPropagation()}
			onPointerDown={onPressIn}
			onFocus={() => setFocused(true)}
			onBlur={() => setFocused(false)}
		>
			<img
				className={styles.image}
				src={image.thumb}
				alt={image.alt}
				width={dims.width}
				height={dims.height}
				loading={index === 0 ? 'eager' : 'lazy'}
				onLoad={(e) => {
					const ar = getAspectRatio({
						width: e.currentTarget.naturalWidth,
						height: e.currentTarget.naturalHeight,
					});
					if (ar && ar !== aspectRatio) {
						setAspectRatio(ar);
					}
				}}
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
			<MediaInsetBorder focused={focused} />
		</Dialog.Trigger>
	);
}

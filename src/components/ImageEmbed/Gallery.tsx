import { useRef, useState } from 'react';

import type { AppBskyEmbedGallery } from '@atcute/bluesky';

import type { LightboxImage } from '@oomfware/lightbox';

import { clsx } from 'clsx';

import { useLargeAltBadgeEnabled } from '#/state/preferences/large-alt-badge';

import * as Dialog from '#/components/Dialog';
import { lightboxHandle } from '#/components/dialogs/handles';
import {
	CAROUSEL_CHAT_MAX_HEIGHT,
	CAROUSEL_CHAT_MIN_HEIGHT,
	CAROUSEL_MAX_HEIGHT,
	CAROUSEL_MIN_HEIGHT,
} from '#/components/ImageEmbed/carousel/const';
import { PagingControls } from '#/components/ImageEmbed/carousel/PagingControls';
import { useKeyboardPaging } from '#/components/ImageEmbed/carousel/useKeyboardPaging';
import { computeDims, getAspectRatio, getCarouselMetrics } from '#/components/ImageEmbed/carousel/utils';
import * as styles from '#/components/ImageEmbed/Gallery.css';
import { MediaBadges } from '#/components/ImageEmbed/MediaBadges';
import { useGalleryBleed } from '#/components/images/Gallery';
import { PostEmbedViewContext } from '#/components/Post/Embed/types';

import ImageIcon from '#/icons/central/Images1_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

export type GalleryProps = {
	images: AppBskyEmbedGallery.ViewImage[];
	lightboxImages: LightboxImage[];
	onPressIn?: () => void;
	viewContext?: PostEmbedViewContext;
};

export function Gallery({ images, lightboxImages, onPressIn, viewContext }: GalleryProps) {
	const largeAltBadge = useLargeAltBadgeEnabled();
	const isWithinChat = viewContext === PostEmbedViewContext.ChatMessage;
	const { bleedStyle, bleedWidth, insetLeft, insetRight, ref: bleedRef } = useGalleryBleed();

	const { contentHeight, paddingRight } = getCarouselMetrics({
		bleedWidth,
		insetLeft,
		insetRight,
		max: isWithinChat ? CAROUSEL_CHAT_MAX_HEIGHT : CAROUSEL_MAX_HEIGHT,
		min: isWithinChat ? CAROUSEL_CHAT_MIN_HEIGHT : CAROUSEL_MIN_HEIGHT,
		ratios: images.map((image) => getAspectRatio(image.aspectRatio)),
	});

	const scrollRef = useRef<HTMLDivElement>(null);
	const { setActiveTile } = useKeyboardPaging({ scrollPaddingLeft: insetLeft, scrollRef });

	return (
		<div ref={bleedRef} className={styles.root} style={{ height: contentHeight }}>
			<div
				ref={scrollRef}
				role="group"
				aria-roledescription={m['components.post.image.a11y.carousel']()}
				aria-label={m['components.post.image.a11y.gallery']({ count: images.length })}
				className={styles.scroll}
				style={{ ...bleedStyle, paddingRight }}
			>
				{images.map((image, index) => (
					<GalleryImage
						// oxlint-disable-next-line react/no-array-index-key -- a post's images never reorder
						key={image.thumbnail + index}
						image={image}
						index={index}
						imageCount={images.length}
						contentHeight={contentHeight}
						largeAltBadge={largeAltBadge}
						lightboxImages={lightboxImages}
						onPressIn={onPressIn}
					/>
				))}
			</div>
			<PagingControls onPage={setActiveTile} scrollPaddingLeft={insetLeft} scrollRef={scrollRef} />
		</div>
	);
}

function GalleryImage({
	image,
	index,
	imageCount,
	contentHeight,
	largeAltBadge,
	lightboxImages,
	onPressIn,
}: {
	image: AppBskyEmbedGallery.ViewImage;
	index: number;
	imageCount: number;
	contentHeight: number;
	largeAltBadge: boolean;
	lightboxImages: LightboxImage[];
	onPressIn?: () => void;
}) {
	const [status, setStatus] = useState<'error' | 'loaded' | 'loading'>(image.thumbnail ? 'loading' : 'error');

	const measure = (node: HTMLImageElement | null) => {
		if (node?.complete) {
			setStatus(node.naturalWidth > 0 ? 'loaded' : 'error');
		}
	};

	// keep dimensions stable when ratio metadata is missing
	const aspectRatio = getAspectRatio(image.aspectRatio);
	const { isCropped, ...dims } = computeDims({ aspectRatio, height: contentHeight });
	const hasAlt = !!image.alt;
	// letterbox images with unknown ratios instead of cropping them to the square fallback
	const isContain = aspectRatio === undefined;

	return (
		<Dialog.Trigger
			handle={lightboxHandle}
			payload={{ images: lightboxImages, index }}
			type="button"
			className={styles.item}
			// size the border box to preserve the reserved peek
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
					<ImageIcon className={styles.imageIcon} />
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
			<MediaBadges variant="gallery" hasAlt={hasAlt} cropped={isCropped} large={largeAltBadge} />
		</Dialog.Trigger>
	);
}

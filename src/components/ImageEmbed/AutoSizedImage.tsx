import { useCallback, useState } from 'react';
import type { AppBskyEmbedImages } from '@atcute/bluesky';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import type { LightboxHandle, LightboxPayload } from '#/components/dialogs/Context';
import { Image_Stroke2_Corner0_Rounded as ImageIcon } from '#/components/icons/Image';
import * as styles from '#/components/ImageEmbed/AutoSizedImage.css';
import { getAspectRatio } from '#/components/ImageEmbed/carousel/utils';
import { MediaBadges } from '#/components/ImageEmbed/MediaBadges';
import * as Dialog from '#/components/web/Dialog';

import { useLargeAltBadgeEnabled } from '#/storage/hooks/large-alt-badge';

export type AutoSizedImageProps = {
	image: AppBskyEmbedImages.ViewImage;
	crop?: 'constrained' | 'none' | 'square';
	/** Lightbox handle + payload; the image renders as a detached `Dialog.Trigger` that opens it. */
	handle: LightboxHandle;
	payload: LightboxPayload;
	onPressIn?: () => void;
};

/**
 * A single post image. It keeps its own aspect ratio — `constrained` (feed) caps the height, `none` (thread
 * anchor) doesn't, and `square` cover-crops to a compact 1:1 quote thumbnail. Clicking opens the lightbox.
 */
export function AutoSizedImage({
	image,
	crop = 'constrained',
	handle,
	payload,
	onPressIn,
}: AutoSizedImageProps) {
	const [status, setStatus] = useState<'error' | 'loaded' | 'loading'>(image.thumb ? 'loading' : 'error');
	const [largeAlt] = useLargeAltBadgeEnabled();

	const measure = useCallback((node: HTMLImageElement | null) => {
		if (node?.complete) {
			setStatus(node.naturalWidth > 0 ? 'loaded' : 'error');
		}
	}, []);
	// Old images, or images from other clients, can lack an aspect ratio; those fall back to a square box.
	const aspectRatio = getAspectRatio(image.aspectRatio);

	const isSquare = crop === 'square';
	// A ratio-less image is letterboxed inside its square box rather than cover-cropped to an unknown shape.
	const isContain = aspectRatio === undefined && !isSquare;
	const className = isSquare ? styles.square : crop === 'none' ? styles.uncapped : styles.constrained;

	const onPointerDown = onPressIn ? () => onPressIn() : undefined;

	return (
		<Dialog.Trigger
			handle={handle}
			payload={payload}
			type="button"
			className={className}
			style={isSquare ? undefined : assignInlineVars({ [styles.ratioVar]: String(aspectRatio ?? 1) })}
			aria-label={image.alt || undefined}
			onPointerDown={onPointerDown}
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
					src={image.thumb}
					alt={image.alt}
					loading="lazy"
					onError={() => setStatus('error')}
					onLoad={() => setStatus('loaded')}
					ref={measure}
				/>
			)}
			{/* A single image keeps its aspect ratio, so it's never cropped. The square quote thumbnail does
			    cover-crop, but we intentionally surface only its alt badge there, not a crop indicator. */}
			<MediaBadges variant="single" hasAlt={!!image.alt} cropped={false} large={largeAlt} />
		</Dialog.Trigger>
	);
}

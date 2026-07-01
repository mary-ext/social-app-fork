import { useState } from 'react';
import type { AppBskyEmbedImages } from '@atcute/bluesky';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import type { LightboxHandle, LightboxPayload } from '#/components/dialogs/Context';
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
	const [largeAlt] = useLargeAltBadgeEnabled();
	// Old images, or images from other clients, can lack an aspect ratio; fall back to square and pick up the
	// real ratio once the image loads.
	const [aspectRatio, setAspectRatio] = useState(() => getAspectRatio(image.aspectRatio));

	const isSquare = crop === 'square';
	// Until a ratio-less image loads we don't know its shape, so letterbox it rather than cover-crop blindly.
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
			<img
				className={clsx(styles.image, isContain && styles.imageContain)}
				src={image.thumb}
				alt={image.alt}
				loading="lazy"
				onLoad={(e) => {
					if (aspectRatio === undefined) {
						const ar = getAspectRatio({
							height: e.currentTarget.naturalHeight,
							width: e.currentTarget.naturalWidth,
						});
						if (ar !== undefined) {
							setAspectRatio(ar);
						}
					}
				}}
			/>
			{/* A single image keeps its aspect ratio, so it's never cropped. The square quote thumbnail does
			    cover-crop, but we intentionally surface only its alt badge there, not a crop indicator. */}
			<MediaBadges variant="single" hasAlt={!!image.alt} cropped={false} large={largeAlt} />
		</Dialog.Trigger>
	);
}

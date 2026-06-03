import type { MouseEvent } from 'react';
import type { AppBskyEmbedImages } from '@atcute/bluesky';
import { assignInlineVars } from '@vanilla-extract/dynamic';

import { cx } from '#/components/web/cx';
import * as styles from '#/components/web/ImageEmbed/AutoSizedImage.css';
import { MediaBadges } from '#/components/web/ImageEmbed/MediaBadges';
import { MediaInsetBorder } from '#/components/web/MediaInsetBorder';

import { useLargeAltBadgeEnabled } from '#/storage/hooks/large-alt-badge';

export type AutoSizedImageProps = {
	image: AppBskyEmbedImages.ViewImage;
	crop?: 'constrained' | 'none' | 'square';
	hideBadge?: boolean;
	onPress?: () => void;
	onPressIn?: () => void;
};

/** A single post image. Sizes itself within a 1:2-clamped bounding box and opens the lightbox on click. */
export function AutoSizedImage({
	image,
	crop = 'constrained',
	hideBadge,
	onPress,
	onPressIn,
}: AutoSizedImageProps) {
	const [largeAlt] = useLargeAltBadgeEnabled();

	let aspectRatio: number | undefined;
	const dims = image.aspectRatio;
	if (dims) {
		aspectRatio = dims.width / dims.height;
		if (Number.isNaN(aspectRatio)) {
			aspectRatio = undefined;
		}
	}

	let constrained: number | undefined;
	let max: number | undefined;
	let rawIsCropped: boolean | undefined;
	if (aspectRatio !== undefined) {
		constrained = Math.max(aspectRatio, 1 / 2); // max of 1:2 ratio in feeds
		max = Math.max(aspectRatio, 0.25); // max of 1:4 in thread
		rawIsCropped = aspectRatio < constrained;
	}

	const cropDisabled = crop === 'none';
	const fullBleed = crop === 'square';
	const isCropped = !!rawIsCropped && !cropDisabled;
	const isContain = aspectRatio === undefined;

	const contents = (
		<>
			<img
				className={cx(styles.image, isContain && styles.imageContain)}
				src={image.thumb}
				alt={image.alt}
				loading="lazy"
			/>
			<MediaInsetBorder />
			{!hideBadge && (
				<MediaBadges variant="single" hasAlt={!!image.alt} cropped={isCropped} large={largeAlt} />
			)}
		</>
	);

	const onPointerDown = onPressIn ? () => onPressIn() : undefined;
	// Scope the press to opening the lightbox: don't let the click bubble to an ancestor post link (a quote's
	// `<a>`, or the feed item's thread link) and navigate away. Mirrors RN's press-responder scoping.
	const onClick = onPress
		? (e: MouseEvent) => {
				e.preventDefault();
				e.stopPropagation();
				onPress();
			}
		: undefined;

	if (cropDisabled) {
		return (
			<button
				type="button"
				className={styles.pressableBleed}
				style={assignInlineVars({ [styles.maxRatioVar]: String(max ?? 1) })}
				aria-label={image.alt || undefined}
				onClick={onClick}
				onPointerDown={onPointerDown}
			>
				{contents}
			</button>
		);
	}

	const ratio = constrained ?? 1;
	const pad = `${Math.min(1 / ratio, 1) * 100}%`;

	return (
		<div className={styles.outer}>
			<div className={styles.sizer} style={assignInlineVars({ [styles.padVar]: pad })}>
				<div className={styles.abs}>
					<div
						className={cx(styles.innerBox, fullBleed ? styles.innerBoxFullBleed : styles.innerBoxConstrained)}
						style={fullBleed ? undefined : assignInlineVars({ [styles.ratioVar]: String(ratio) })}
					>
						<button
							type="button"
							className={styles.pressable}
							aria-label={image.alt || undefined}
							onClick={onClick}
							onPointerDown={onPointerDown}
						>
							{contents}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

import type { AppBskyEmbedImages } from '@atcute/bluesky';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import type { LightboxControl, LightboxPayload } from '#/components/dialogs/Context';
import * as styles from '#/components/ImageEmbed/AutoSizedImage.css';
import { MediaBadges } from '#/components/ImageEmbed/MediaBadges';
import * as Dialog from '#/components/web/Dialog';

import { useLargeAltBadgeEnabled } from '#/storage/hooks/large-alt-badge';

export type AutoSizedImageProps = {
	image: AppBskyEmbedImages.ViewImage;
	crop?: 'constrained' | 'none' | 'square';
	hideBadge?: boolean;
	/** Lightbox handle + payload; the image renders as a detached `Dialog.Trigger` that opens it. */
	control: LightboxControl;
	payload: LightboxPayload;
	onPressIn?: () => void;
};

/** A single post image. Sizes itself within a 1:2-clamped bounding box and opens the lightbox on click. */
export function AutoSizedImage({
	image,
	crop = 'constrained',
	hideBadge,
	control,
	payload,
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
				className={clsx(styles.image, isContain && styles.imageContain)}
				src={image.thumb}
				alt={image.alt}
				loading="lazy"
			/>
			{!hideBadge && (
				<MediaBadges variant="single" hasAlt={!!image.alt} cropped={isCropped} large={largeAlt} />
			)}
		</>
	);

	const onPointerDown = onPressIn ? () => onPressIn() : undefined;

	if (cropDisabled) {
		return (
			<Dialog.Trigger
				handle={control}
				payload={payload}
				type="button"
				className={styles.pressableBleed}
				style={assignInlineVars({ [styles.maxRatioVar]: String(max ?? 1) })}
				aria-label={image.alt || undefined}
				onPointerDown={onPointerDown}
			>
				{contents}
			</Dialog.Trigger>
		);
	}

	const ratio = constrained ?? 1;
	const pad = `${Math.min(1 / ratio, 1) * 100}%`;

	return (
		<div className={styles.outer}>
			<div className={styles.sizer} style={assignInlineVars({ [styles.padVar]: pad })}>
				<div className={styles.abs}>
					<div
						className={clsx(
							styles.innerBox,
							fullBleed ? styles.innerBoxFullBleed : styles.innerBoxConstrained,
						)}
						style={fullBleed ? undefined : assignInlineVars({ [styles.ratioVar]: String(ratio) })}
					>
						<Dialog.Trigger
							handle={control}
							payload={payload}
							type="button"
							className={styles.pressable}
							aria-label={image.alt || undefined}
							onPointerDown={onPointerDown}
						>
							{contents}
						</Dialog.Trigger>
					</div>
				</div>
			</div>
		</div>
	);
}

import { useCallback, useState } from 'react';

import { clsx } from 'clsx';

import { Image_Stroke2_Corner0_Rounded as ImageIcon } from '#/components/icons/Image';

import * as styles from './EmbedThumb.css';

export type EmbedThumbProps = {
	/** Replaces the default full-bleed card geometry; sizes the frame the image fills. */
	frameClassName?: string;
	/** Thumbnail image URL; the placeholder shows when omitted or on load failure. */
	src?: string;
};

/**
 * media slot for a link or embed card. lazily loads the thumbnail and falls back to a placeholder icon if the
 * source is missing or fails to load.
 *
 * @param props configuration options for the embed thumbnail
 */
export function EmbedThumb({ frameClassName, src }: EmbedThumbProps) {
	// remount on a new `src` so the load status starts fresh — feed rows recycle this slot across posts.
	return <Thumb frameClassName={frameClassName} key={src} src={src} />;
}

function Thumb({ frameClassName, src }: EmbedThumbProps) {
	// kept hidden until it resolves so the browser's broken-image glyph never flashes on the way to the
	// fallback.
	const [status, setStatus] = useState<'error' | 'loaded' | 'loading'>(src ? 'loading' : 'error');

	// a cached image can finish loading before React wires up `onLoad`, leaving the status stuck on
	// 'loading'; settle it from the element's own state when the ref attaches.
	const measure = useCallback((node: HTMLImageElement | null) => {
		if (node?.complete) {
			setStatus(node.naturalWidth > 0 ? 'loaded' : 'error');
		}
	}, []);

	return (
		<div className={clsx(styles.frame, frameClassName ?? styles.cardFrame)}>
			{status === 'error' ? (
				<span className={styles.fallback}>
					<ImageIcon fill="currentColor" size="3xl" />
				</span>
			) : (
				<img
					alt=""
					className={clsx(styles.image, status === 'loading' && styles.loading)}
					loading="lazy"
					onError={() => setStatus('error')}
					onLoad={() => setStatus('loaded')}
					ref={measure}
					src={src}
				/>
			)}
		</div>
	);
}

import { useCallback, useEffect, useRef, useState } from 'react';

import {
	type LightboxImage,
	Lightbox as Lb,
	type LightboxTapInfo,
	useLightbox,
	useLightboxState,
} from '@oomfware/lightbox';

import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { clsx } from 'clsx';

import { saveImageToMediaLibrary } from '#/lib/media/manip';

import type { LightboxPayload } from '#/components/dialogs/Context';
import { ArrowOutOfBox_Stroke2_Corner0_Rounded as ShareIcon } from '#/components/icons/ArrowOutOfBox';
import {
	ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeftIcon,
	ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon,
} from '#/components/icons/Chevron';
import { DotGrid3x1_Stroke2_Corner0_Rounded as EllipsisIcon } from '#/components/icons/DotGrid';
import { Download_Stroke2_Corner0_Rounded as DownloadIcon } from '#/components/icons/Download';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import * as Menu from '#/components/Menu';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

import * as styles from './Lightbox.css';
import { LightboxLoading } from './LightboxLoading';

export function LightboxContents({
	payload,
	open,
	close,
}: {
	payload: LightboxPayload;
	open: boolean;
	close: () => void;
}) {
	const viewportRef = useRef<HTMLDivElement>(null);
	const [chromeVisible, setChromeVisible] = useState(true);

	// each open starts with the chrome shown; Base UI keeps this content mounted after close, so reopening
	// the same instance would otherwise inherit whatever the last session toggled it to. reset during render
	// (against the previous open value) so the reopened lightbox never commits a stale hidden-chrome frame.
	const [prevOpen, setPrevOpen] = useState(open);
	if (prevOpen !== open) {
		setPrevOpen(open);
		if (open) {
			setChromeVisible(true);
		}
	}

	// arrow-key paging is bound to the viewport (tabIndex -1); the eager popup no longer hands it
	// initialFocus, so focus it here on open.
	useEffect(() => {
		if (open) {
			viewportRef.current?.focus({ preventScroll: true });
		}
	}, [open]);

	const toggleTimer = useRef<number | null>(null);
	useEffect(
		() => () => {
			if (toggleTimer.current !== null) {
				clearTimeout(toggleTimer.current);
			}
		},
		[],
	);
	const onTap = useCallback((info: LightboxTapInfo) => {
		// only taps on the image toggle the chrome — backdrop/chrome taps keep their own behaviour (mouse
		// backdrop-click closes, the controls handle their own clicks).
		if (!info.onImage) {
			return;
		}
		// the lib fires onTap on the *first* tap of a double-tap-to-zoom too, so defer the toggle past the
		// engine's double-tap window (300ms): a second tap inside it cancels the pending toggle, leaving the
		// zoom unflickered.
		if (toggleTimer.current !== null) {
			clearTimeout(toggleTimer.current);
			toggleTimer.current = null;
			return;
		}
		toggleTimer.current = window.setTimeout(() => {
			toggleTimer.current = null;
			setChromeVisible((v) => !v);
		}, DOUBLE_TAP_MS);
	}, []);

	return (
		<Lb.Provider active={open} images={payload.images} defaultIndex={payload.index} onDismiss={close}>
			<Lb.Viewport ref={viewportRef} className={styles.viewport} onTap={onTap}>
				<Lb.Track>{renderSlide}</Lb.Track>
				<div className={clsx(styles.chrome, !chromeVisible && styles.chromeHidden)}>
					<Chrome />
				</div>
			</Lb.Viewport>
		</Lb.Provider>
	);
}

/**
 * the lib's double-tap-to-zoom window (`DOUBLE_TAP_MS` in its engine); single-tap chrome toggles wait this
 * out.
 */
const DOUBLE_TAP_MS = 300;

/** custom slide renderer for `Lb.Track` */
const renderSlide = (image: LightboxImage, index: number) => (
	<Slide key={image.src} image={image} index={index} />
);

/** A carousel cell that overlays a spinner on the lib's image until the full-size source resolves. */
function Slide({ image, index }: { image: LightboxImage; index: number }) {
	const loading = useImageLoading(image.src);

	return (
		<Lb.Slide index={index}>
			<Lb.Image index={index} />
			{loading ? <LightboxLoading /> : null}
		</Lb.Slide>
	);
}

/**
 * track whether a full-size image is still loading via preload. resolves on both load and error to prevent
 * infinite loading states.
 */
function useImageLoading(src: string) {
	const [loading, setLoading] = useState(true);
	useEffect(() => {
		const img = new window.Image();
		const controller = new AbortController();
		let active = true;
		const done = () => {
			if (active) {
				setLoading(false);
			}
		};
		img.addEventListener('load', done, { signal: controller.signal });
		img.addEventListener('error', done, { signal: controller.signal });
		img.src = src;
		// a cached source can already be complete before the handlers attach
		if (img.complete) {
			done();
		}
		return () => {
			active = false;
			controller.abort();
		};
	}, [src]);
	return loading;
}

function Chrome() {
	const { images, next, prev } = useLightbox();
	const index = useLightboxState((state) => state.index);
	const [altExpanded, setAltExpanded] = useState(false);

	const img = images[index];
	const canLeft = index > 0;
	const canRight = index < images.length - 1;

	const onShare = async () => {
		const url = img?.src;
		if (!url) {
			return;
		}
		if (typeof navigator !== 'undefined' && 'share' in navigator && navigator.share) {
			try {
				await navigator.share({ url });
			} catch {
				// user cancelled or share failed; no-op
			}
		} else if (typeof navigator !== 'undefined' && navigator.clipboard) {
			try {
				await navigator.clipboard.writeText(url);
				Toast.show(m['components.lightbox.share.copiedToast']());
			} catch {
				Toast.show(m['components.lightbox.share.error'](), { type: 'error' });
			}
		}
	};

	const onDownload = () => {
		const url = img?.src;
		if (!url) {
			return;
		}
		saveImageToMediaLibrary({ uri: url }).then(
			() => Toast.show(m['components.lightbox.download.savedToast']()),
			() => Toast.show(m['components.lightbox.download.error'](), { type: 'error' }),
		);
	};

	return (
		<>
			{canLeft && (
				<button
					type="button"
					className={clsx(styles.navButton, styles.navLeft)}
					aria-label={m['components.lightbox.a11y.previous']()}
					onClick={prev}
				>
					<ChevronLeftIcon size="lg" fill="currentColor" />
				</button>
			)}
			{canRight && (
				<button
					type="button"
					className={clsx(styles.navButton, styles.navRight)}
					aria-label={m['components.lightbox.a11y.next']()}
					onClick={next}
				>
					<ChevronRightIcon size="lg" fill="currentColor" />
				</button>
			)}
			<div className={styles.topLeft}>
				<Menu.Root>
					<Menu.Trigger className={styles.circle} aria-label={m['components.lightbox.a11y.options']()}>
						<EllipsisIcon size="lg" fill="currentColor" className={styles.rotated} />
					</Menu.Trigger>
					<Menu.Popup label={m['components.lightbox.a11y.options']()}>
						<Menu.Item label={m['components.lightbox.share.label']()} onClick={() => void onShare()}>
							<Menu.ItemText>{m['components.lightbox.share.label']()}</Menu.ItemText>
							<Menu.ItemIcon icon={ShareIcon} position="right" />
						</Menu.Item>
						<Menu.Item label={m['components.lightbox.download.label']()} onClick={onDownload}>
							<Menu.ItemText>{m['components.lightbox.download.label']()}</Menu.ItemText>
							<Menu.ItemIcon icon={DownloadIcon} position="right" />
						</Menu.Item>
					</Menu.Popup>
				</Menu.Root>
			</div>
			<BaseDialog.Close
				aria-label={m['components.lightbox.a11y.close']()}
				className={clsx(styles.circle, styles.topRight)}
			>
				<XIcon size="lg" fill="currentColor" />
			</BaseDialog.Close>
			{img?.alt ? (
				<div className={styles.altPanel}>
					<button
						type="button"
						className={styles.altButton}
						aria-label={m['components.lightbox.altText.expand']()}
						onClick={() => setAltExpanded((v) => !v)}
					>
						<Text size="md" numberOfLines={altExpanded ? undefined : 3} className={styles.altText}>
							{img.alt}
						</Text>
					</button>
				</div>
			) : null}
			{images.length > 1 && (
				<>
					<div className={styles.pagerDots}>
						<div className={styles.dotPill}>
							{images.map((image, i) => (
								<span key={image.src} className={i === index ? styles.dotActive : styles.dotInactive} />
							))}
						</div>
					</div>
					<div aria-live="polite" aria-atomic="true" className={styles.srOnly}>
						<Text>
							{m['components.lightbox.a11y.imagePosition']({ index: index + 1, count: images.length })}
						</Text>
					</div>
				</>
			)}
		</>
	);
}

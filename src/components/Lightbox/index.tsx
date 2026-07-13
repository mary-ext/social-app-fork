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

import * as Dialog from '#/components/Dialog';
import { type LightboxPayload, useGlobalDialogsHandleContext } from '#/components/dialogs/Context';
import { ArrowOutOfBox_Stroke2_Corner0_Rounded as ShareIcon } from '#/components/icons/ArrowOutOfBox';
import {
	ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeftIcon,
	ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon,
} from '#/components/icons/Chevron';
import { DotGrid3x1_Stroke2_Corner0_Rounded as EllipsisIcon } from '#/components/icons/DotGrid';
import { Download_Stroke2_Corner0_Rounded as DownloadIcon } from '#/components/icons/Download';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import * as styles from '#/components/Lightbox/Lightbox.css';
import * as Menu from '#/components/Menu';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

/**
 * global image lightbox singleton dialog driven by the `lightboxHandle` in the global dialogs context. open
 * it with `lightboxHandle.openWithPayload({ images, index })`.
 */
export function Lightbox() {
	const { lightboxHandle } = useGlobalDialogsHandleContext();
	const [open, setOpen] = useState(false);
	const close = useCallback(() => lightboxHandle.close(), [lightboxHandle]);
	useBackButtonCloses(open, close);

	// Base UI keeps the payload (and thus `LightboxContents`) mounted after close, so the engine persists across
	// opens. Rather than remount it per open to rebuild the engine at the new index, we feed the dialog's open
	// state to the lib's `active` prop and the payload's index to `defaultIndex`. The lib resets the engine to
	// `defaultIndex` both on the `active` false → true edge and whenever `defaultIndex` moves while active; the
	// latter is load-bearing here, because Base UI flips `open` synchronously on the trigger click but forwards
	// the new trigger's `payload` one commit later (via a layout effect), so the activation edge alone resets to
	// the *previous* open's index and the index update has to re-reset. Remounting on payload identity instead
	// would miss a reopen from the *same* trigger — Base UI forwards that trigger's `payload` prop unchanged, so
	// the object identity (and thus a key derived from it) never changes, leaving the engine on the index it was
	// last paged to.
	return (
		<Dialog.Root handle={lightboxHandle} onOpenChange={(next) => setOpen(next)}>
			{({ payload }: { payload: LightboxPayload | undefined }) =>
				payload ? <LightboxContents payload={payload} open={open} close={close} /> : null
			}
		</Dialog.Root>
	);
}

function LightboxContents({
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

	// the lib Provider wraps the whole Portal so both the Scrim (in the Backdrop) and the Viewport/chrome (in the
	// Popup) get its context; React context flows through portals by tree position, not DOM position. `active`
	// resets the engine to `defaultIndex` on each open edge; on a reopen the new `payload` (and thus the clicked
	// image's index) arrives a commit after `open` flips, so it's the lib's re-reset on a `defaultIndex` change
	// while active that lands the engine on the image just clicked.
	return (
		<Lb.Provider active={open} images={payload.images} defaultIndex={payload.index} onDismiss={close}>
			<BaseDialog.Portal>
				<BaseDialog.Backdrop className={styles.backdrop}>
					<Lb.Scrim className={styles.scrim} />
				</BaseDialog.Backdrop>
				<BaseDialog.Popup
					aria-label={m['components.lightbox.a11y.viewer']()}
					className={styles.popup}
					initialFocus={viewportRef}
				>
					<Lb.Viewport ref={viewportRef} className={styles.viewport} onTap={onTap}>
						<Lb.Track>{renderSlide}</Lb.Track>
						<div className={clsx(styles.chrome, !chromeVisible && styles.chromeHidden)}>
							<Chrome />
						</div>
					</Lb.Viewport>
				</BaseDialog.Popup>
			</BaseDialog.Portal>
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
			{loading ? (
				<div className={styles.slideSpinner}>
					<Spinner label={m['components.lightbox.a11y.loading']()} color="white" />
				</div>
			) : null}
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

/**
 * push a history entry when the lightbox opens so the browser back button closes it instead of navigating
 * away
 */
function useBackButtonCloses(open: boolean, onClose: () => void) {
	useEffect(() => {
		if (!open) {
			return;
		}
		let didPushHistory = false;
		let closedByPopState = false;
		const pushHistory = requestAnimationFrame(() => {
			history.pushState({ lightbox: true }, '');
			didPushHistory = true;
		});

		const handlePopState = () => {
			closedByPopState = true;
			onClose();
		};
		window.addEventListener('popstate', handlePopState);

		return () => {
			cancelAnimationFrame(pushHistory);
			window.removeEventListener('popstate', handlePopState);
			if (!didPushHistory) {
				return;
			}
			// Only pop our entry if it's still the current one; if navigation pushed a new entry on top, leave
			// the orphan (it shares the same URL, so traversing it is harmless).
			if (!closedByPopState && (history.state as { lightbox?: boolean })?.lightbox) {
				history.back();
			}
		};
	}, [open, onClose]);
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { Trans, useLingui } from '@lingui/react/macro';
import { Lightbox as Lb, useLightbox, useLightboxState } from '@oomfware/lightbox';

import { saveImageToMediaLibrary } from '#/lib/media/manip';

import { type LightboxPayload, useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { ArrowOutOfBox_Stroke2_Corner0_Rounded as ShareIcon } from '#/components/icons/ArrowOutOfBox';
import {
	ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeftIcon,
	ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon,
} from '#/components/icons/Chevron';
import { DotGrid3x1_Stroke2_Corner0_Rounded as EllipsisIcon } from '#/components/icons/DotGrid';
import { Download_Stroke2_Corner0_Rounded as DownloadIcon } from '#/components/icons/Download';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import * as Toast from '#/components/Toast';
import { cx } from '#/components/web/cx';
import * as Dialog from '#/components/web/Dialog';
import * as styles from '#/components/web/Lightbox/Lightbox.css';
import * as Menu from '#/components/web/Menu';
import { Text } from '#/components/web/Text';

/**
 * The global image lightbox: a singleton Base UI dialog driven by the `lightboxControl` handle in the global
 * dialogs context. Opened from anywhere with `lightboxControl.openWithPayload({ images, index })` (or a
 * `<Dialog.Trigger handle={lightboxControl} payload={…}>`). The gesture engine + carousel come from the
 * headless `@oomfware/lightbox`; this component supplies the modal shell (focus trap, scroll lock, Escape)
 * and the chrome.
 */
export function Lightbox() {
	const { lightboxControl } = useGlobalDialogsControlContext();
	const [open, setOpen] = useState(false);
	const close = useCallback(() => lightboxControl.close(), [lightboxControl]);
	useBackButtonCloses(open, close);

	// Base UI keeps the payload (and thus `LightboxContents`) mounted after close and commits a fresh payload
	// object per open. Keying the content on that object's identity remounts it exactly when the new payload
	// lands — rebuilding the engine at the right `defaultIndex`. Keying on the open edge instead would remount
	// while the render still sees the previous payload, leaving the engine one open behind.
	const keys = useRef(new WeakMap<object, number>());
	const nextKey = useRef(0);
	const keyFor = (payload: object) => {
		let key = keys.current.get(payload);
		if (key === undefined) {
			key = nextKey.current++;
			keys.current.set(payload, key);
		}
		return key;
	};

	// Our `Dialog.Root` (not the raw Base UI one) registers into `state/dialogs`, so `closeAllDialogs` and the
	// global hotkey-scope toggle span the lightbox like every other web dialog.
	return (
		<Dialog.Root handle={lightboxControl} onOpenChange={(next) => setOpen(next)}>
			{({ payload }: { payload: LightboxPayload | undefined }) =>
				payload ? <LightboxContents key={keyFor(payload)} payload={payload} close={close} /> : null
			}
		</Dialog.Root>
	);
}

function LightboxContents({ payload, close }: { payload: LightboxPayload; close: () => void }) {
	const { t: l } = useLingui();
	const viewportRef = useRef<HTMLDivElement>(null);

	// the lib Provider wraps the whole Portal so both the Scrim (in the Backdrop) and the Viewport/chrome (in the
	// Popup) get its context; React context flows through portals by tree position, not DOM position. A fresh
	// `key` per open (see `keyFor`) remounts this, so the engine is rebuilt at the current `defaultIndex`.
	return (
		<Lb.Provider images={payload.images} defaultIndex={payload.index} onDismiss={close}>
			<BaseDialog.Portal>
				<BaseDialog.Backdrop className={styles.backdrop}>
					<Lb.Scrim className={styles.scrim} />
				</BaseDialog.Backdrop>
				<BaseDialog.Popup aria-label={l`Image viewer`} className={styles.popup} initialFocus={viewportRef}>
					<Lb.Viewport ref={viewportRef} className={styles.viewport}>
						<Lb.Track />
						<Chrome />
					</Lb.Viewport>
				</BaseDialog.Popup>
			</BaseDialog.Portal>
		</Lb.Provider>
	);
}

function Chrome() {
	const { t: l } = useLingui();
	const { images, next, prev } = useLightbox();
	const index = useLightboxState((state) => state.index);
	const [altExpanded, setAltExpanded] = useState(false);

	const img = images[index];
	const canLeft = index > 0;
	const canRight = index < images.length - 1;

	const onShare = useCallback(async () => {
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
				Toast.show(l`Link copied to clipboard`);
			} catch {
				Toast.show(l`Failed to copy link`, { type: 'error' });
			}
		}
	}, [img?.src, l]);

	const onDownload = useCallback(() => {
		const url = img?.src;
		if (!url) {
			return;
		}
		saveImageToMediaLibrary({ uri: url }).then(
			() => Toast.show(l`Image saved`),
			() => Toast.show(l`Failed to save image`, { type: 'error' }),
		);
	}, [img?.src, l]);

	return (
		<>
			{canLeft && (
				<button
					type="button"
					className={cx(styles.navButton, styles.navLeft)}
					aria-label={l`Previous image`}
					onClick={prev}
				>
					<ChevronLeftIcon size="md" fill="currentColor" />
				</button>
			)}
			{canRight && (
				<button
					type="button"
					className={cx(styles.navButton, styles.navRight)}
					aria-label={l`Next image`}
					onClick={next}
				>
					<ChevronRightIcon size="md" fill="currentColor" />
				</button>
			)}

			<div className={styles.topLeft}>
				<Menu.Root modal={false}>
					<Menu.Trigger className={styles.circle} aria-label={l`Image options`}>
						<span className={styles.rotated}>
							<EllipsisIcon size="md" fill="currentColor" />
						</span>
					</Menu.Trigger>
					<Menu.Popup label={l`Image options`}>
						<Menu.Item label={l`Share image`} onClick={onShare}>
							<Menu.ItemText>
								<Trans>Share image</Trans>
							</Menu.ItemText>
							<Menu.ItemIcon icon={ShareIcon} position="right" />
						</Menu.Item>
						<Menu.Item label={l`Download image`} onClick={onDownload}>
							<Menu.ItemText>
								<Trans>Download image</Trans>
							</Menu.ItemText>
							<Menu.ItemIcon icon={DownloadIcon} position="right" />
						</Menu.Item>
					</Menu.Popup>
				</Menu.Root>
			</div>

			<BaseDialog.Close aria-label={l`Close image viewer`} className={cx(styles.circle, styles.topRight)}>
				<XIcon size="md" fill="currentColor" />
			</BaseDialog.Close>

			{img?.alt ? (
				<div className={styles.altPanel}>
					<button
						type="button"
						className={styles.altButton}
						aria-label={l`Expand alt text`}
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
							<Trans>
								Image {index + 1} of {images.length}
							</Trans>
						</Text>
					</div>
				</>
			)}
		</>
	);
}

/**
 * While the lightbox is open, push a history entry so the browser back button closes it instead of navigating
 * away. Keyed to `open` (not component mount) since Base UI keeps the dialog payload — and thus its content —
 * mounted after close.
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

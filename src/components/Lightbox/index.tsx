import { lazy, Suspense, useCallback, useEffect, useState } from 'react';

import { Dialog as BaseDialog } from '@base-ui/react/dialog';

import * as Dialog from '#/components/Dialog';
import { type LightboxPayload, useGlobalDialogsHandleContext } from '#/components/dialogs/Context';

import { m } from '#/paraglide/messages';

import * as styles from './Lightbox.css';
import { LightboxLoading } from './LightboxLoading';

const importLightboxContents = () =>
	import('./LightboxContents').then((mod) => ({ default: mod.LightboxContents }));

const LightboxContents = lazy(importLightboxContents);

export function preloadLightbox() {
	void importLightboxContents();
}

/**
 * global image lightbox singleton dialog driven by the `lightboxHandle` in the global dialogs context. open
 * it with `lightboxHandle.openWithPayload({ images, index })`.
 */
export function Lightbox() {
	const { lightboxHandle } = useGlobalDialogsHandleContext();
	const [open, setOpen] = useState(false);
	const close = useCallback(() => lightboxHandle.close(), [lightboxHandle]);
	useBackButtonCloses(open, close);

	// backdrop + popup stay eager so the enter transition runs the instant `open` flips; only the heavy
	// `@oomfware/lightbox` interior loads lazily, behind the Suspense boundary inside the popup.
	//
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
				payload ? (
					<BaseDialog.Portal>
						<BaseDialog.Backdrop className={styles.backdrop} />
						<BaseDialog.Popup aria-label={m['components.lightbox.a11y.viewer']()} className={styles.popup}>
							<Suspense fallback={<LightboxLoading size="xl" />}>
								<LightboxContents payload={payload} open={open} close={close} />
							</Suspense>
						</BaseDialog.Popup>
					</BaseDialog.Portal>
				) : null
			}
		</Dialog.Root>
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

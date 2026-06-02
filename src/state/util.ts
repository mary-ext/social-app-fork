import { useCallback } from 'react';

import { useDialogStateControlContext } from '#/state/dialogs';

import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { useLightboxControls } from '#/components/Lightbox/state';

import { useComposerControls } from './shell/composer';
import { useSetDrawerOpen } from './shell/drawer-open';

/** returns true if something was closed (used by the android hardware back btn) */
export function useCloseAnyActiveElement() {
	const { closeLightbox } = useLightboxControls();
	const { closeComposer } = useComposerControls();
	const { closeAllDialogs } = useDialogStateControlContext();
	const { composerDialogControl } = useGlobalDialogsControlContext();
	const setDrawerOpen = useSetDrawerOpen();
	return useCallback(() => {
		if (closeLightbox()) {
			return true;
		}
		// The composer is itself an ALF dialog now; exclude it here so the back button peels off one
		// layer at a time (sub-dialogs first, then the composer via `closeComposer` below).
		if (closeAllDialogs({ except: [composerDialogControl.control.id] })) {
			return true;
		}
		if (closeComposer()) {
			return true;
		}
		setDrawerOpen(false);
		return false;
	}, [closeLightbox, closeComposer, setDrawerOpen, closeAllDialogs, composerDialogControl.control.id]);
}

/** used to clear out any modals, eg for a navigation */
export function useCloseAllActiveElements() {
	const { closeLightbox } = useLightboxControls();
	const { closeComposer } = useComposerControls();
	const { closeAllDialogs: closeAlfDialogs } = useDialogStateControlContext();
	const setDrawerOpen = useSetDrawerOpen();
	return useCallback(() => {
		closeLightbox();
		closeComposer();
		closeAlfDialogs();
		setDrawerOpen(false);
	}, [closeLightbox, closeComposer, closeAlfDialogs, setDrawerOpen]);
}

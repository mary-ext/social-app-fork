import { useCallback } from 'react';

import { useComposerControls } from '#/lib/hooks/useOpenComposer';

import { useDialogStateControlContext } from '#/state/dialogs';

import { useSetDrawerOpen } from './shell/drawer-open';

/** used to clear out any modals, eg for a navigation */
export function useCloseAllActiveElements() {
	const { closeComposer } = useComposerControls();
	// The lightbox is a registered web dialog now, so `closeAllDialogs` covers it alongside the rest.
	const { closeAllDialogs: closeAlfDialogs } = useDialogStateControlContext();
	const setDrawerOpen = useSetDrawerOpen();
	return useCallback(() => {
		closeComposer();
		closeAlfDialogs();
		setDrawerOpen(false);
	}, [closeComposer, closeAlfDialogs, setDrawerOpen]);
}

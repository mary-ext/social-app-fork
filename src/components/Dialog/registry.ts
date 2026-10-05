import { useEffect } from 'react';

import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';
import { setKeybindScopeActive } from '#/lib/keybinds';

const openDialogs = new Map<string, () => void>();

/** closes every open dialog. */
export function closeAllDialogs(): void {
	for (const close of openDialogs.values()) {
		close();
	}
}

const setDialogIsOpen = (id: string, close: (() => void) | null) => {
	if (close) {
		openDialogs.set(id, close);
	} else {
		openDialogs.delete(id);
	}
	setKeybindScopeActive('dialog', openDialogs.size > 0);
};

/**
 * registers a dialog into the registry
 *
 * @param id stable dialog id
 * @param close callback to close the dialog imperatively
 * @returns an `onOpenChange` handler to forward to the dialog root
 */
export function useRegisterDialog(id: string, close: () => void) {
	const stableClose = useNonReactiveCallback(close);

	// a dialog unmounting while open never reports back, so drop it here
	useEffect(() => {
		return () => setDialogIsOpen(id, null);
	}, [id]);

	return (open: boolean) => setDialogIsOpen(id, open ? stableClose : null);
}

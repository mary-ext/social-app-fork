import { useEffect } from 'react';

import { mapDefined } from '@mary/array-fns';

import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';
import { setKeybindScopeActive } from '#/lib/keybinds';

const openDialogs = new Map<string, () => void>();

interface CloseAllDialogsOptions {
	/** ids of dialogs to leave open. */
	except?: string[];
}

/**
 * closes every open dialog.
 *
 * @param opts which dialogs to spare
 */
export function closeAllDialogs(opts: CloseAllDialogsOptions = {}): void {
	const except = new Set(opts.except);
	const closing = mapDefined([...openDialogs], ([id, close]) => {
		if (except.has(id)) {
			return;
		}

		return close;
	});

	for (const close of closing) {
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

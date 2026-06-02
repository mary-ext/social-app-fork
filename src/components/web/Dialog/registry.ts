import { useEffect, useRef } from 'react';

import type { DialogControlRefProps } from '#/components/Dialog';
import { useDialogStateContext, useDialogStateControlContext } from '#/state/dialogs';

/**
 * Bridges a Base UI dialog into the app's shared `state/dialogs` registry so `closeAllDialogs` and the
 * hotkey-scope toggling keep working across both the old RNW dialogs and the new web-native ones.
 *
 * @param id stable dialog id (from `useId`)
 * @param close closes the dialog imperatively (e.g. `Dialog` passes its Root `actionsRef.close`, `Prompt`
 *   passes its `handle.close`); invoked by `closeAllDialogs`
 * @returns an `onOpenChange` handler to forward to the Base UI Root
 */
export function useRegisterDialog(id: string, close: () => void) {
	const { activeDialogs } = useDialogStateContext();
	const { setDialogIsOpen } = useDialogStateControlContext();

	const controlRef = useRef<DialogControlRefProps>({ open: () => {}, close } as DialogControlRefProps);
	controlRef.current.close = close;

	useEffect(() => {
		const map = activeDialogs.current;
		map.set(id, controlRef);
		return () => {
			map.delete(id);
			setDialogIsOpen(id, false);
		};
	}, [id, activeDialogs, setDialogIsOpen]);

	return (open: boolean) => setDialogIsOpen(id, open);
}

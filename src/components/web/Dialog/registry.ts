import { type RefObject, useEffect, useRef } from 'react';

import type { DialogControlRefProps } from '#/components/Dialog';
import { useDialogStateContext, useDialogStateControlContext } from '#/state/dialogs';

type DialogActions = { close: () => void; unmount: () => void };

/**
 * Bridges a Base UI dialog into the app's shared `state/dialogs` registry so `closeAllDialogs` and the
 * hotkey-scope toggling keep working across both the old RNW dialogs and the new web-native ones.
 *
 * @param id stable dialog id (from `useId`)
 * @param actionsRef the Base UI Root `actionsRef`, used to imperatively close on `closeAllDialogs`
 * @returns an `onOpenChange` handler to forward to the Base UI Root
 */
export function useRegisterDialog(id: string, actionsRef: RefObject<DialogActions | null>) {
	const { activeDialogs } = useDialogStateContext();
	const { setDialogIsOpen } = useDialogStateControlContext();

	const controlRef = useRef<DialogControlRefProps>({
		open: () => {},
		close: () => actionsRef.current?.close(),
	} as DialogControlRefProps);

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

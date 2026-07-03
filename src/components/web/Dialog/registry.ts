import { useEffect, useRef } from 'react';

import { useDialogStateContext, useDialogStateControlContext } from '#/state/dialogs';

import type { DialogControlRefProps } from '#/components/Dialog';

/**
 * bridges a dialog into the shared dialog registry to support global closing.
 *
 * @param id stable dialog id
 * @param close callback to close the dialog imperatively
 * @returns an `onOpenChange` handler to forward to the dialog root
 */
export function useRegisterDialog(id: string, close: () => void) {
	const { activeDialogs } = useDialogStateContext();
	const { setDialogIsOpen } = useDialogStateControlContext();

	const controlRef = useRef<DialogControlRefProps>({ open: () => {}, close });
	useEffect(() => {
		controlRef.current.close = close;
	});

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

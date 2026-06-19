import { createContext, useContext, useEffect, useId, useMemo, useRef } from 'react';

import { useDialogStateContext } from '#/state/dialogs';

import type { DialogContextProps, DialogControlRefProps, DialogOuterProps } from '#/components/Dialog/types';

import { IS_DEV } from '#/env';

export const Context = createContext<DialogContextProps>({
	close: () => {},
	disableDrag: false,
	setDisableDrag: () => {},
	isWithinDialog: false,
	isHeightConstrained: false,
});
Context.displayName = 'DialogContext';

export function useDialogContext() {
	return useContext(Context);
}

export function useDialogControl(): DialogOuterProps['control'] {
	const id = useId();
	const control = useRef<DialogControlRefProps>({
		open: () => {},
		close: () => {},
	});
	const { activeDialogs } = useDialogStateContext();

	useEffect(() => {
		const dialogs = activeDialogs.current;
		dialogs.set(id, control);
		return () => {
			dialogs.delete(id);
		};
	}, [id, activeDialogs]);

	return useMemo<DialogOuterProps['control']>(
		() => ({
			id,
			ref: control,
			open: () => {
				if (control.current) {
					control.current.open();
				} else {
					if (IS_DEV) {
						console.warn(
							'Attemped to open a dialog control that was not attached to a dialog!\n' +
								'Please ensure that the Dialog is mounted when calling open/close',
						);
					}
				}
			},
			close: (cb) => {
				if (control.current) {
					control.current.close(cb);
				} else {
					if (IS_DEV) {
						console.warn(
							'Attemped to close a dialog control that was not attached to a dialog!\n' +
								'Please ensure that the Dialog is mounted when calling open/close',
						);
					}
				}
			},
		}),
		[id, control],
	);
}

import { createContext, use, useEffect, useId, useRef } from 'react';

import { useConstant } from '#/lib/hooks/use-constant';

import { useRegisterDialog } from '#/components/Dialog/registry';
import * as BaseDialog from '#/components/primitives/dialog';

export const Trigger = BaseDialog.Trigger;

export const createHandle = BaseDialog.createHandle;

export type DialogHandle<T = void> = BaseDialog.Handle<T>;

/** @returns a stable, component-local dialog handle */
export function useDialogHandle<T = void>(): DialogHandle<T> {
	const handle = useConstant(createHandle<T>);
	return handle;
}

export type OpenChangeDetails = BaseDialog.OpenChangeDetails;

export type RootProps<Payload = void> = Omit<BaseDialog.RootProps<Payload>, 'onOpenChangeComplete'>;

type RegisterBackHandler = (onBack: () => void) => () => void;

const BackHandlerContext = createContext<RegisterBackHandler | null>(null);
BackHandlerContext.displayName = 'DialogBackHandlerContext';

/**
 * intercepts Escape and Android back in the enclosing dialog; no-op outside one. only the latest handler
 * runs; removing it does not restore an earlier handler.
 *
 * @param onBack called in place of closing; `undefined` lets the dialog close as usual
 */
export function useDialogBackHandler(onBack: (() => void) | undefined) {
	const register = use(BackHandlerContext);

	useEffect(() => {
		if (!register || !onBack) {
			return;
		}
		return register(onBack);
	}, [register, onBack]);
}

export function Root<Payload = void>({
	children,
	handle,
	disablePointerDismissal,
	open,
	defaultOpen,
	onOpenChange,
}: RootProps<Payload>) {
	const id = useId();
	const ownHandle = useDialogHandle<Payload>();
	const resolvedHandle = handle ?? ownHandle;
	const registerOpen = useRegisterDialog(id, () => resolvedHandle.close());

	const backHandler = useRef<(() => void) | null>(null);
	const registerBackHandler = useConstant((): RegisterBackHandler => (onBack) => {
		backHandler.current = onBack;
		return () => {
			if (backHandler.current === onBack) {
				backHandler.current = null;
			}
		};
	});

	return (
		<BackHandlerContext.Provider value={registerBackHandler}>
			<BaseDialog.Root
				defaultOpen={defaultOpen}
				disablePointerDismissal={disablePointerDismissal}
				handle={resolvedHandle}
				onOpenChange={(next, details) => {
					if (!next && details.reason === 'escape-key') {
						const onBack = backHandler.current;
						if (onBack) {
							details.cancel();
							onBack();
							return;
						}
					}

					onOpenChange?.(next, details);
					if (!details.isCanceled) {
						registerOpen(next);
					}
				}}
				open={open}
			>
				{children}
			</BaseDialog.Root>
		</BackHandlerContext.Provider>
	);
}

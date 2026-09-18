import { createContext, type ReactNode, use, useEffect, useId, useRef } from 'react';

import { Dialog as BaseDialog } from '@base-ui/react/dialog';

import { useConstant } from '#/lib/hooks/use-constant';

import { useRegisterDialog } from '#/components/Dialog/registry';

export const Trigger = BaseDialog.Trigger;

/** Creates a detached handle to open/close a Dialog imperatively or from a detached Trigger. */
export const createHandle = BaseDialog.createHandle;

/** A detached handle for opening/closing a Dialog */
export type DialogHandle<T = void> = BaseDialog.Handle<T>;

/** Component-local dialog handle. */
export function useDialogHandle<T = void>(): DialogHandle<T> {
	const handle = useConstant(createHandle<T>);
	return handle;
}

type DialogActions = { close: () => void; unmount: () => void };

/** Reason + cancel handle for an open-state change; `cancel()` prevents Base UI from honouring it. */
export type OpenChangeDetails = { reason: string; cancel: () => void };

export type RootProps<Payload = unknown> = {
	/** A node, or a render function receiving the active trigger's `payload` (undefined while closed). */
	children?: ReactNode | ((bag: { payload: Payload | undefined }) => ReactNode);
	handle?: DialogHandle<Payload>;
	/**
	 * stable id under which this dialog registers in the shared registry. pass an explicit id when callers need
	 * to reference it; defaults to a generated one.
	 */
	id?: string;
	/** Prevent clicks outside the popup from dismissing it (the close button and Escape still work). */
	disablePointerDismissal?: boolean;
	modal?: boolean | 'trap-focus';
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
};

type RegisterBackHandler = (onBack: () => void) => () => void;

const BackHandlerContext = createContext<RegisterBackHandler | null>(null);
BackHandlerContext.displayName = 'DialogBackHandlerContext';

/**
 * handles Android back instead of closing the enclosing dialog. no-op outside a dialog. only the latest
 * registration is used; removing it does not restore an earlier handler.
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

export function Root<Payload = unknown>({
	children,
	handle,
	id: idProp,
	disablePointerDismissal,
	modal,
	open,
	defaultOpen,
	onOpenChange,
}: RootProps<Payload>) {
	const generatedId = useId();
	const id = idProp ?? generatedId;
	const actionsRef = useRef<DialogActions>(null);
	const registerOpen = useRegisterDialog(id, () => actionsRef.current?.close());

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
				actionsRef={actionsRef}
				defaultOpen={defaultOpen}
				disablePointerDismissal={disablePointerDismissal}
				handle={handle}
				modal={modal}
				onOpenChange={(next, details) => {
					if (!next && details.reason === 'close-watcher') {
						const onBack = backHandler.current;
						if (onBack) {
							// the Base UI patch replaces the watcher after a canceled close.
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

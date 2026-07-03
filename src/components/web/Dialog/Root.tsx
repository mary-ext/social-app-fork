import { type ReactNode, useId, useRef } from 'react';

import { Dialog as BaseDialog } from '@base-ui/react/dialog';

import { useConstant } from '#/lib/hooks/use-constant';

import { useRegisterDialog } from '#/components/web/Dialog/registry';

export const Trigger = BaseDialog.Trigger;
export const Title = BaseDialog.Title;
export const Description = BaseDialog.Description;

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
	 * Stable id under which this dialog registers in the shared `state/dialogs` registry. Pass an explicit id
	 * when callers need to reference it (e.g. `closeAllDialogs({ except: [id] })`); defaults to a generated
	 * one.
	 */
	id?: string;
	/** Prevent clicks outside the popup from dismissing it (the close button and Escape still work). */
	disablePointerDismissal?: boolean;
	modal?: boolean | 'trap-focus';
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
};

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

	return (
		<BaseDialog.Root
			actionsRef={actionsRef}
			defaultOpen={defaultOpen}
			disablePointerDismissal={disablePointerDismissal}
			handle={handle}
			modal={modal}
			onOpenChange={(next, details) => {
				registerOpen(next);
				onOpenChange?.(next, details);
			}}
			open={open}
		>
			{children}
		</BaseDialog.Root>
	);
}

import { type ReactNode, useId, useRef, useState } from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { useLingui } from '@lingui/react/macro';

import { TimesLarge_Stroke2_Corner0_Rounded as TimesIcon } from '#/components/icons/Times';
import { cx } from '#/components/web/cx';
import * as styles from '#/components/web/Dialog/Dialog.css';
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
	const [handle] = useState(createHandle<T>);
	return handle;
}

type DialogActions = { close: () => void; unmount: () => void };

/** Reason + cancel handle for an open-state change; `cancel()` prevents Base UI from honouring it. */
export type OpenChangeDetails = { reason: string; cancel: () => void };

export type RootProps<Payload = unknown> = {
	/** A node, or a render function receiving the active trigger's `payload` (undefined while closed). */
	children?: ReactNode | ((bag: { payload: Payload | undefined }) => ReactNode);
	handle?: DialogHandle<Payload>;
	modal?: boolean | 'trap-focus';
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
};

export function Root<Payload = unknown>({
	children,
	handle,
	modal,
	open,
	defaultOpen,
	onOpenChange,
}: RootProps<Payload>) {
	const id = useId();
	const actionsRef = useRef<DialogActions>(null);
	const registerOpen = useRegisterDialog(id, () => actionsRef.current?.close());

	return (
		<BaseDialog.Root
			actionsRef={actionsRef}
			defaultOpen={defaultOpen}
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

// the portalled backdrop/viewport are rendered into `document.body`, but React still routes their
// events up the *component* tree — so a click would bubble into whatever owns the dialog (e.g. the
// RNW `Link` wrapping an external embed) and trigger it. stop it at the portal boundary.
//
// TODO: revisit when we redo router/navigation — the leak stems from the RNW `Link`/`<a>` press
// handler sitting above the portal on the component tree, and this guard may become unnecessary.
const stopPropagation = (e: { stopPropagation: () => void }) => e.stopPropagation();

/** Portalled backdrop + scrollable viewport + themed popup card. Put dialog content inside. */
export function Popup({
	children,
	size = 'default',
	className,
	label,
}: {
	children: ReactNode;
	size?: 'default' | 'narrow';
	className?: string;
	/** Accessible name for the dialog. */
	label?: string;
}) {
	return (
		<BaseDialog.Portal>
			<BaseDialog.Backdrop className={styles.backdrop} onClick={stopPropagation} />
			<BaseDialog.Viewport className={styles.viewport} onClick={stopPropagation}>
				<BaseDialog.Popup aria-label={label} className={cx(styles.popup, styles.popupSize[size], className)}>
					{children}
				</BaseDialog.Popup>
			</BaseDialog.Viewport>
		</BaseDialog.Portal>
	);
}

/** Top-right close (×) button. */
export function Close() {
	const { t: l } = useLingui();
	return (
		<BaseDialog.Close aria-label={l`Close dialog`} className={styles.closeBtn}>
			<TimesIcon size="md" fill="currentColor" />
		</BaseDialog.Close>
	);
}

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

/** Component-local dialog handle. */
export function useDialogHandle() {
	const [handle] = useState(createHandle);
	return handle;
}

type DialogActions = { close: () => void; unmount: () => void };

export type RootProps = {
	children?: ReactNode;
	handle?: ReturnType<typeof createHandle>;
	modal?: boolean | 'trap-focus';
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
};

export function Root({ children, handle, modal, open, defaultOpen, onOpenChange }: RootProps) {
	const id = useId();
	const actionsRef = useRef<DialogActions>(null);
	const registerOpen = useRegisterDialog(id, () => actionsRef.current?.close());

	return (
		<BaseDialog.Root
			actionsRef={actionsRef}
			defaultOpen={defaultOpen}
			handle={handle}
			modal={modal}
			onOpenChange={(next) => {
				registerOpen(next);
				onOpenChange?.(next);
			}}
			open={open}
		>
			{children}
		</BaseDialog.Root>
	);
}

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
			<BaseDialog.Backdrop className={styles.backdrop} />
			<BaseDialog.Viewport className={styles.viewport}>
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

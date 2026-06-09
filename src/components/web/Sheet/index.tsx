import type { ReactNode } from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { clsx } from 'clsx';

import {
	Close,
	createHandle,
	type DialogHandle,
	Root,
	Trigger,
	useDialogHandle,
} from '#/components/web/Dialog';
import * as dialogStyles from '#/components/web/Dialog/Popup.css';
import * as styles from '#/components/web/Sheet/Sheet.css';

// a Sheet is a header dialog: it reuses the basic Dialog's Root/Trigger/handle/registry and supplies a
// structured popup (sticky header + scrollable body).
export { Close, createHandle, Root, Trigger };
/**
 * A detached handle for opening/closing a Sheet (shares the Dialog surface); `T` is the `openWithPayload`
 * type.
 */
export type SheetHandle<T = void> = DialogHandle<T>;
export const useSheetHandle = useDialogHandle;
export * as Header from '#/components/web/Dialog/Header';

/** Portalled backdrop + viewport + a flex-column popup (header pinned, body scrolls). */
export function Popup({
	children,
	fullHeight,
	label,
	outerClose,
}: {
	children: ReactNode;
	/** Lock the popup to its max height so it doesn't shrink to fit transient loading/empty/error states. */
	fullHeight?: boolean;
	label?: string;
	/** Render the close button at the screen corner (outside the popup) — for full-height dialogs. */
	outerClose?: boolean;
}) {
	return (
		<BaseDialog.Portal>
			{/* forceRender so a Sheet opened inside another dialog (e.g. the composer Sheet) still dims */}
			<BaseDialog.Backdrop className={dialogStyles.backdrop} forceRender />
			<BaseDialog.Viewport className={dialogStyles.viewport}>
				{outerClose && <Close outer />}
				<BaseDialog.Popup
					aria-label={label}
					className={clsx(styles.popup, fullHeight && styles.popupFullHeight)}
				>
					{children}
				</BaseDialog.Popup>
			</BaseDialog.Viewport>
		</BaseDialog.Portal>
	);
}

export function Body({ children }: { children: ReactNode }) {
	return <div className={styles.body}>{children}</div>;
}

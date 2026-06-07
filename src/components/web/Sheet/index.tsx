import type { ReactNode } from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';

import {
	Close,
	createHandle,
	type DialogHandle,
	Root,
	Trigger,
	useDialogHandle,
} from '#/components/web/Dialog';
import * as dialogStyles from '#/components/web/Dialog/Dialog.css';
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
export * as Header from '#/components/web/Sheet/Header';

/** Portalled backdrop + viewport + a flex-column popup (header pinned, body scrolls). */
export function Popup({
	children,
	label,
	outerClose,
}: {
	children: ReactNode;
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
				<BaseDialog.Popup aria-label={label} className={styles.popup}>
					{children}
				</BaseDialog.Popup>
			</BaseDialog.Viewport>
		</BaseDialog.Portal>
	);
}

export function Body({ children }: { children: ReactNode }) {
	return <div className={styles.body}>{children}</div>;
}

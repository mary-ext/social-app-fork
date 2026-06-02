import type { ReactNode } from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';

import { Close, createHandle, Root, Trigger, useDialogHandle } from '#/components/web/Dialog';
import * as dialogStyles from '#/components/web/Dialog/Dialog.css';
import * as styles from '#/components/web/Sheet/Sheet.css';

// a Sheet is a header dialog: it reuses the basic Dialog's Root/Trigger/handle/registry and supplies a
// structured popup (sticky header + scrollable body).
export { Close, createHandle, Root, Trigger };
export const useSheetHandle = useDialogHandle;
export * as Header from '#/components/web/Sheet/Header';

/** Portalled backdrop + viewport + a flex-column popup (header pinned, body scrolls). */
export function Popup({ children, label }: { children: ReactNode; label?: string }) {
	return (
		<BaseDialog.Portal>
			<BaseDialog.Backdrop className={dialogStyles.backdrop} />
			<BaseDialog.Viewport className={dialogStyles.viewport}>
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

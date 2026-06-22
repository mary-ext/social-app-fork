import type { ReactNode } from 'react';
import { Toast as BaseToast } from '@base-ui/react/toast';

import { ToastViewport } from '#/components/Toast/Toast';
import type { ShowOptions, ToastData } from '#/components/Toast/types';

export type { ToastType } from '#/components/Toast/types';

/** Default auto-dismiss time, in ms. */
export const DURATION = 3e3;

// the shared manager lives outside React so `show` can be called from anywhere (including non-component
// code), while the renderer mounted by `ToastOutlet` consumes the same queue.
const manager = BaseToast.createToastManager<ToastData>();

/** Toasts are rendered in a global outlet, placed once near the top of the component tree. */
export function ToastOutlet() {
	return <ToastViewport manager={manager} />;
}

/**
 * Shows a toast.
 *
 * @param content the message — a string or any React node
 * @param options type, duration, an optional action button, a custom icon, or an explicit id
 */
export function show(content: ReactNode, { action, duration, icon, id, type = 'default' }: ShowOptions = {}) {
	const toastId = id ?? crypto.randomUUID();
	manager.add({
		actionProps: action && {
			children: action.label,
			onClick: () => {
				manager.close(toastId);
				action.onPress();
			},
		},
		data: { icon },
		id: toastId,
		timeout: duration ?? DURATION,
		title: content,
		type,
	});
}

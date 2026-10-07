import { lazy, type ReactNode, Suspense, useEffect, useState, useSyncExternalStore } from 'react';

import { createToastManager } from '#/components/primitives/toast/manager';
import type { ShowOptions, ToastData } from '#/components/Toast/types';

export type { ToastType } from '#/components/Toast/types';

/** default auto-dismiss time, in ms. */
export const DURATION = 3e3;

const manager = createToastManager<ToastData>({ timeout: DURATION });

const ToastViewport = lazy(() =>
	import('#/components/Toast/Toast').then((mod) => ({ default: mod.ToastViewport })),
);

const hasToasts = () => manager.toasts.length > 0;

/**
 * renders global toasts; mount once at the app root.
 *
 * @returns the lazy-loaded viewport, or `null` until loading starts
 */
export function ToastOutlet() {
	const pending = useSyncExternalStore(manager.subscribe, hasToasts);
	const [ready, setReady] = useState(false);

	// mount the live region during idle time so later toasts can be announced.
	useEffect(() => {
		const load = () => setReady(true);
		if ('requestIdleCallback' in window) {
			const handle = requestIdleCallback(load, { timeout: 5e3 });
			return () => cancelIdleCallback(handle);
		}
		const handle = setTimeout(load, 0);
		return () => clearTimeout(handle);
	}, []);

	if (pending && !ready) {
		setReady(true);
	}
	if (!ready) {
		return null;
	}
	return (
		<Suspense>
			<ToastViewport manager={manager} />
		</Suspense>
	);
}

/**
 * shows a toast from component or non-component code.
 *
 * @param content toast message
 * @param options appearance, duration, action, and id
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
		timeout: duration,
		title: content,
		type,
	});
}

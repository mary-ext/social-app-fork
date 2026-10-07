import { type ReactNode, useEffect, useState, useSyncExternalStore } from 'react';

import { useConstant } from '#/lib/hooks/use-constant';

import { createToastManager, type ToastManager, type ToastManagerOptions } from './manager';
import { getPlacements, ProviderContext, type ProviderContextValue } from './shared';

export type ProviderProps = ToastManagerOptions & {
	children?: ReactNode;
	/** uses this manager instead of creating one; ignores `timeout` and `limit`. */
	toastManager?: ToastManager;
};

/**
 * provides toast state and pauses timers on hover, keyboard focus, or window blur.
 *
 * @param props manager or its options, and children
 * @returns the provider
 */
export const Provider = ({ children, toastManager, timeout, limit }: ProviderProps) => {
	const ownManager = useConstant(() => (toastManager ? null : createToastManager({ timeout, limit })));
	const manager = toastManager ?? ownManager!;

	const toasts = useSyncExternalStore(manager.subscribe, () => manager.toasts);
	const [hovering, setHovering] = useState(false);
	const [focused, setFocused] = useState(false);
	const [windowFocused, setWindowFocused] = useState(() => document.hasFocus());

	const empty = toasts.length === 0;
	const expanded = !empty && (hovering || focused);

	useEffect(() => {
		manager.setPaused(expanded || !windowFocused);
	}, [manager, expanded, windowFocused]);

	useEffect(() => {
		const sync = () => {
			setWindowFocused(document.hasFocus());
		};
		window.addEventListener('blur', sync);
		window.addEventListener('focus', sync);
		return () => {
			window.removeEventListener('blur', sync);
			window.removeEventListener('focus', sync);
		};
	}, []);

	if (empty && (hovering || focused)) {
		setHovering(false);
		setFocused(false);
	}

	const value: ProviderContextValue = {
		manager,
		toasts,
		placements: getPlacements(toasts),
		expanded,
		setHovering,
		setFocused,
	};

	return <ProviderContext value={value}>{children}</ProviderContext>;
};

import { createContext, useContext } from 'react';

import type { ToastManager, ToastObject } from './manager';

export type ToastPlacement = {
	/** zero-based position among non-closing toasts; closing toasts keep their queue position. */
	index: number;
	/** sum of the heights of the toasts in front of this one, in px. */
	offsetY: number;
};

export type ProviderContextValue = {
	manager: ToastManager;
	toasts: readonly ToastObject[];
	placements: ReadonlyMap<string, ToastPlacement>;
	/** whether the stack is expanded by hover or keyboard focus. */
	expanded: boolean;
	setHovering: (hovering: boolean) => void;
	setFocused: (focused: boolean) => void;
};

export const ProviderContext = createContext<ProviderContextValue | null>(null);
ProviderContext.displayName = 'ToastProviderContext';

/**
 * @returns the enclosing provider's state
 * @throws if called outside `Provider`
 */
export const useProviderContext = (): ProviderContextValue => {
	const ctx = useContext(ProviderContext);
	if (ctx === null) {
		throw new Error(`toast parts require <Toast.Provider>`);
	}
	return ctx;
};

export type RootContextValue = {
	toast: ToastObject;
	expanded: boolean;
	behind: boolean;
	titleId: string;
	descriptionId: string;
	/**
	 * @param part rendered label
	 * @returns a function that unregisters the label
	 */
	registerLabel: (part: 'description' | 'title') => () => void;
};

export const RootContext = createContext<RootContextValue | null>(null);
RootContext.displayName = 'ToastRootContext';

/**
 * @returns the enclosing toast's state
 * @throws if called outside `Root`
 */
export const useRootContext = (): RootContextValue => {
	const ctx = useContext(RootContext);
	if (ctx === null) {
		throw new Error(`toast parts require <Toast.Root>`);
	}
	return ctx;
};

/**
 * @param toasts toasts, newest first
 * @returns stacking placement for each toast
 */
export const getPlacements = (toasts: readonly ToastObject[]): Map<string, ToastPlacement> => {
	const placements = new Map<string, ToastPlacement>();
	let visible = 0;
	let offsetY = 0;
	for (const [domIndex, toast] of toasts.entries()) {
		const ending = toast.transitionStatus === 'ending';
		placements.set(toast.id, { index: ending ? domIndex : visible, offsetY });
		offsetY += toast.height ?? 0;
		if (!ending) {
			visible++;
		}
	}
	return placements;
};

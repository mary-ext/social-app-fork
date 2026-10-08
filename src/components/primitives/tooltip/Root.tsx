'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type ReactNode, useId } from 'react';

import { useHoverPopupRoot } from '../hover-popup';
import { type OpenChangeDetails, type OpenChangeReason, RootContext, type RootContextValue } from './shared';

export type RootProps = {
	children?: ReactNode;
	/** controlled open state. */
	open?: boolean;
	/** initial uncontrolled open state. */
	defaultOpen?: boolean;
	/** receives cancellable open/close requests. */
	onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
	/** receives the open state after animations finish. */
	onOpenChangeComplete?: (open: boolean) => void;
	/** prevents opening and hides an open tooltip. */
	disabled?: boolean;
	/** closes on trigger leave, after `closeDelay`, even when the pointer enters the popup. */
	disableHoverablePopup?: boolean;
};

/**
 * shares state across the tooltip parts.
 *
 * @param props tooltip parts, open state, and callbacks
 * @returns the tooltip parts without a wrapper element
 */
export const Root = ({
	children,
	open,
	defaultOpen = false,
	onOpenChange,
	onOpenChangeComplete,
	disabled = false,
	disableHoverablePopup = false,
}: RootProps) => {
	const popup = useHoverPopupRoot<OpenChangeReason>({
		open,
		defaultOpen,
		disabled,
		onOpenChange,
		onOpenChangeComplete,
	});

	const value: RootContextValue = {
		...popup,
		disabled,
		disableHoverablePopup,
		anchorName: `--tooltip-${CSS.escape(useId())}`,
	};

	return <RootContext.Provider value={value}>{children}</RootContext.Provider>;
};

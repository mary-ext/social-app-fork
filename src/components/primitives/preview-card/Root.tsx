'use no memo';

import { type ReactNode, useId, useRef } from 'react';

import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

import { HOVERABLE_GRACE } from '../anchored-popup';
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
};

/**
 * shares state across the preview card parts.
 *
 * @param props preview card parts, open state, and callbacks
 * @returns the preview card parts without a wrapper element
 */
export const Root = ({
	children,
	open,
	defaultOpen = false,
	onOpenChange,
	onOpenChangeComplete,
}: RootProps) => {
	const popup = useHoverPopupRoot<OpenChangeReason>({
		open,
		defaultOpen,
		disabled: false,
		onOpenChange,
		onOpenChangeComplete,
	});
	const closeDelayRef = useRef(0);

	const startHoverClose = useNonReactiveCallback((event: Event) => {
		if (popup.openReasonRef.current !== 'trigger-hover') {
			return;
		}
		popup.timeout.start(Math.max(closeDelayRef.current, HOVERABLE_GRACE), () =>
			popup.setOpen(false, 'trigger-hover', event),
		);
	});

	const value: RootContextValue = {
		...popup,
		anchorName: `--preview-card-${CSS.escape(useId())}`,
		closeDelayRef,
		startHoverClose,
	};

	return <RootContext.Provider value={value}>{children}</RootContext.Provider>;
};

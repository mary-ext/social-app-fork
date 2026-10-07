import { createContext, type PointerEvent, type RefObject, useContext } from 'react';

import type { Timeout } from '@base-ui/utils/useTimeout';

/** minimum gap-crossing time for hoverable popups, in milliseconds. */
export const HOVERABLE_GRACE = 100;

export type OpenChangeReason =
	| 'escape-key'
	| 'outside-press'
	| 'trigger-focus'
	| 'trigger-hover'
	| 'trigger-press';

export type OpenChangeDetails = {
	reason: OpenChangeReason;
	event: Event;
	/** cancels this open/close request. */
	cancel(): void;
};

export type RootContextValue = {
	open: boolean;
	mounted: boolean;
	disabled: boolean;
	disableHoverablePopup: boolean;
	anchorName: string;
	/** blocks reopening after activation or Escape until the pointer or focus leaves the trigger. */
	blockedRef: RefObject<boolean>;
	triggerRef: RefObject<HTMLElement | null>;
	positionerRef: RefObject<HTMLDivElement | null>;
	setOpen: (open: boolean, reason: OpenChangeReason, event: Event) => void;
	/** shared timer; opening and closing cancel each other's pending work. */
	timeout: Timeout;
	onTransitionSettled: (open: boolean) => void;
};

export const RootContext = createContext<RootContextValue | null>(null);
RootContext.displayName = 'TooltipRootContext';

/**
 * @returns the enclosing tooltip's state
 * @throws if called outside `Root`
 */
export const useRootContext = (): RootContextValue => {
	const ctx = useContext(RootContext);
	if (ctx === null) {
		throw new Error(`tooltip parts require <Tooltip.Root>`);
	}
	return ctx;
};

/**
 * @param event pointer event to classify
 * @returns whether the pointer is a mouse or pen
 */
export const isMouseLike = (event: PointerEvent): boolean => {
	// some Linux Chromium builds report mouse input as "pen".
	return event.pointerType === 'mouse' || event.pointerType === 'pen';
};

export const openStateAttributes = {
	open: (open: boolean): Record<string, string> => (open ? { 'data-open': '' } : { 'data-closed': '' }),
};

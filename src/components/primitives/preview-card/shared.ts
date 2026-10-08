import { createContext, type RefObject, useContext } from 'react';

import type { Timeout } from '#/lib/hooks/use-timeout';

export type OpenChangeReason =
	| 'escape-key'
	| 'focus-out'
	| 'light-dismiss'
	| 'outside-press'
	| 'trigger-focus'
	| 'trigger-hover';

export type OpenChangeDetails = {
	reason: OpenChangeReason;
	event: Event;
	/** cancels this open/close request. */
	cancel(): void;
};

export type RootContextValue = {
	open: boolean;
	mounted: boolean;
	anchorName: string;
	/** blocks focus reopening until the pointer or focus leaves the trigger. */
	blockedRef: RefObject<boolean>;
	/** hovered trigger's `closeDelay`. */
	closeDelayRef: RefObject<number>;
	triggerRef: RefObject<HTMLElement | null>;
	positionerRef: RefObject<HTMLDivElement | null>;
	setOpen: (open: boolean, reason: OpenChangeReason, event: Event) => void;
	/** schedules a close only for hover-opened cards. */
	startHoverClose: (event: Event) => void;
	/** shared timer; opening and closing cancel each other's pending work. */
	timeout: Timeout;
	onTransitionSettled: (open: boolean) => void;
};

export const RootContext = createContext<RootContextValue | null>(null);
RootContext.displayName = 'PreviewCardRootContext';

/**
 * @returns the enclosing preview card's state
 * @throws if called outside `Root`
 */
export const useRootContext = (): RootContextValue => {
	const ctx = useContext(RootContext);
	if (ctx === null) {
		throw new Error(`preview card parts require <PreviewCard.Root>`);
	}
	return ctx;
};

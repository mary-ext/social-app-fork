import { createContext, type RefObject, useContext } from 'react';

import type { ChangeDetails } from '../change-details';
import type { HoverPopupState } from '../hover-popup';

export type OpenChangeReason =
	| 'escape-key'
	| 'focus-out'
	| 'light-dismiss'
	| 'outside-press'
	| 'trigger-focus'
	| 'trigger-hover';

export type OpenChangeDetails = ChangeDetails<OpenChangeReason>;

export type RootContextValue = HoverPopupState<OpenChangeReason> & {
	anchorName: string;
	/** hovered trigger's `closeDelay`. */
	closeDelayRef: RefObject<number>;
	/** schedules a close only for hover-opened cards. */
	startHoverClose: (event: Event) => void;
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

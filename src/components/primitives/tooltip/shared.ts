import { createContext, useContext } from 'react';

import type { ChangeDetails } from '../change-details';
import type { HoverPopupState } from '../hover-popup';

export type OpenChangeReason =
	| 'escape-key'
	| 'focus-out'
	| 'light-dismiss'
	| 'outside-press'
	| 'trigger-focus'
	| 'trigger-hover'
	| 'trigger-press';

export type OpenChangeDetails = ChangeDetails<OpenChangeReason>;

export type RootContextValue = HoverPopupState<OpenChangeReason> & {
	disabled: boolean;
	disableHoverablePopup: boolean;
	anchorName: string;
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

import { createContext, type RefObject, useContext } from 'react';

import type { ChangeDetails } from '../change-details';

export type OpenChangeDetails = ChangeDetails<'none'>;

export type RootContextValue = {
	open: boolean;
	disabled: boolean;
	mounted: boolean;
	rootRef: RefObject<HTMLDetailsElement | null>;
	/**
	 * @param open requested open state
	 * @param event event that caused the request
	 * @returns whether the change was accepted
	 */
	setOpen: (open: boolean, event: Event) => boolean;
	onTransitionSettled: (open: boolean) => void;
};

export const RootContext = createContext<RootContextValue | null>(null);
RootContext.displayName = 'CollapsibleRootContext';

/**
 * @returns the enclosing collapsible's state
 * @throws if called outside `Root`
 */
export const useRootContext = (): RootContextValue => {
	const ctx = useContext(RootContext);
	if (ctx === null) {
		throw new Error(`collapsible parts require <Collapsible.Root>`);
	}
	return ctx;
};

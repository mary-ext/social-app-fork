import { createContext, useContext } from 'react';

import type { ChangeDetails } from '../change-details';
import type { Orientation } from '../composite';

export type { Orientation };

export type TabValue = number | string;

export type ValueChangeDetails = ChangeDetails<'none'>;

export type RootContextValue = {
	value: TabValue | null;
	orientation: Orientation;
	/**
	 * @param value tab value
	 * @returns the matching tab's id
	 */
	getTabId: (value: TabValue) => string;
	/**
	 * @param value tab value
	 * @returns the matching panel's id
	 */
	getPanelId: (value: TabValue) => string;
	/**
	 * @param value requested value
	 * @param event event that caused the request
	 */
	setValue: (value: TabValue, event: Event) => void;
};

export const RootContext = createContext<RootContextValue | null>(null);
RootContext.displayName = 'TabsRootContext';

/**
 * @returns the enclosing tabs' state
 * @throws if called outside `Root`
 */
export const useRootContext = (): RootContextValue => {
	const ctx = useContext(RootContext);
	if (ctx === null) {
		throw new Error(`tabs parts require <Tabs.Root>`);
	}
	return ctx;
};

export const ListContext = createContext<{ activateOnFocus: boolean } | null>(null);
ListContext.displayName = 'TabsListContext';

/**
 * @returns the enclosing tab list's behavior
 * @throws if called outside `List`
 */
export const useListContext = (): { activateOnFocus: boolean } => {
	const ctx = useContext(ListContext);
	if (ctx === null) {
		throw new Error(`<Tabs.Tab> requires <Tabs.List>`);
	}
	return ctx;
};

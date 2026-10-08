import { createContext, useContext } from 'react';

import type { Orientation } from '../composite';

export type { Orientation };

export type RootContextValue = {
	orientation: Orientation;
	disabled: boolean;
};

export const RootContext = createContext<RootContextValue | null>(null);
RootContext.displayName = 'ToolbarRootContext';

export const GroupContext = createContext<boolean>(false);
GroupContext.displayName = 'ToolbarGroupContext';

/**
 * @returns the enclosing toolbar's state
 * @throws if called outside `Root`
 */
export const useRootContext = (): RootContextValue => {
	const ctx = useContext(RootContext);
	if (ctx === null) {
		throw new Error(`toolbar parts require <Toolbar.Root>`);
	}
	return ctx;
};

/** @returns whether an enclosing toolbar or toolbar group is disabled; `false` outside a toolbar */
export const useToolbarDisabled = (): boolean => {
	const root = useContext(RootContext);
	const group = useContext(GroupContext);
	return (root?.disabled ?? false) || group;
};

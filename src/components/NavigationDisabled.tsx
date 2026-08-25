'use no memo'; // generated cache cost outweighs reuse in these shallow renderers

import { createContext, type ReactNode, use } from 'react';

const NavigationDisabledContext = createContext(false);
NavigationDisabledContext.displayName = 'NavigationDisabledContext';

/**
 * disables navigation for supported link components in its subtree.
 *
 * @param children content to render
 * @returns the rendered subtree
 */
export const NavigationDisabled = ({ children }: { children: ReactNode }) => (
	<NavigationDisabledContext value={true}>{children}</NavigationDisabledContext>
);

/**
 * re-enables navigation inside a disabled subtree.
 *
 * @param children content to render
 * @returns the rendered subtree
 */
export const NavigationEnabled = ({ children }: { children: ReactNode }) => (
	<NavigationDisabledContext value={false}>{children}</NavigationDisabledContext>
);

/**
 * returns whether navigation is disabled in the current subtree.
 *
 * @returns whether navigation is disabled
 */
export const useNavigationDisabled = () => use(NavigationDisabledContext);

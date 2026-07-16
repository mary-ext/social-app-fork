import { useContext } from 'react';
import type { ReactElement } from 'react';

import { CurrentNodeContext } from './context.ts';
import { Pool } from './router-view.tsx';

/**
 * renders the child branch pool within a layout component.
 *
 * @returns rendered outlet child pool or null if outside a layout
 */
export const Outlet = (): ReactElement | null => {
	const current = useContext(CurrentNodeContext);
	if (current === null) {
		return null;
	}
	return <Pool nodes={current.node.children} />;
};

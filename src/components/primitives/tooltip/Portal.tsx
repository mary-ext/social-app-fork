import type { ReactNode } from 'react';

import { createPopupPortal, type PortalContainer } from '../anchored-popup';
import { useRootContext } from './shared';

export type PortalProps = {
	children?: ReactNode;
	container?: PortalContainer;
};

/**
 * renders popup content while mounted, including during exit transitions.
 *
 * @param props content and portal target
 * @returns a portal, or `null` while unmounted
 */
export const Portal = ({ children, container }: PortalProps) => {
	const { mounted } = useRootContext();
	return mounted ? createPopupPortal(children, container) : null;
};

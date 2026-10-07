import type { ReactNode } from 'react';

import { createPopupPortal } from '../anchored-popup';
import { useRootContext } from './shared';

export type PortalProps = {
	children?: ReactNode;
};

/**
 * renders popup content while mounted, including during exit transitions.
 *
 * @param props content
 * @returns a portal, or `null` while unmounted
 */
export const Portal = ({ children }: PortalProps) => {
	const { mounted } = useRootContext();
	return mounted ? createPopupPortal(children, undefined) : null;
};

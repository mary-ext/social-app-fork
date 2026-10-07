import type { ReactNode, RefObject } from 'react';

import { createPortal } from 'react-dom';

import { useRootContext } from '#/components/primitives/tooltip/shared';

export type PortalProps = {
	children?: ReactNode;
	/** portal target; defaults to `document.body`. */
	container?: HTMLElement | RefObject<HTMLElement | null> | null;
};

/**
 * the container determines inheritance; the popup remains in the top layer.
 *
 * @param props content and portal target
 * @returns a portal, or `null` while unmounted
 */
export const Portal = ({ children, container }: PortalProps) => {
	const { mounted } = useRootContext();
	if (!mounted) {
		return null;
	}

	const target = container && 'current' in container ? container.current : container;
	return createPortal(children, target ?? document.body);
};

import { type ReactNode, useLayoutEffect } from 'react';

import { useRootContext } from './shared';

/**
 * registers a rendered title or description for ARIA association.
 *
 * @param part label field
 * @param children explicit content; falls back to the toast's field
 * @returns the element id, content, and whether there is anything to render
 */
export const useLabel = (
	part: 'description' | 'title',
	children: ReactNode,
): { id: string; children: ReactNode; present: boolean } => {
	const { toast, titleId, descriptionId, registerLabel } = useRootContext();
	const content = children ?? toast[part];
	const present = content != null && content !== false && content !== '';

	useLayoutEffect(() => {
		if (present) {
			return registerLabel(part);
		}
	}, [present, part, registerLabel]);

	return { id: part === 'title' ? titleId : descriptionId, children: content, present };
};

'use no memo';

import { useRender } from '@base-ui/react/use-render';

import { expandedStateAttributes, useRootContext } from './shared';

export type ContentState = {
	expanded: boolean;
	/** whether the toast is behind the frontmost one. */
	behind: boolean;
};

export type ContentProps = useRender.ComponentProps<'div', ContentState>;

const contentStateAttributes = {
	...expandedStateAttributes,
	behind: (behind: boolean): Record<string, string> | null => (behind ? { 'data-behind': '' } : null),
};

/**
 * groups toast content and exposes expanded and behind state for styling.
 *
 * @param props element props
 * @returns the content element; a `<div>` by default
 */
export const Content = ({ render, ref, ...elementProps }: ContentProps) => {
	const { expanded, behind } = useRootContext();

	return useRender({
		render,
		ref,
		state: { expanded, behind },
		stateAttributesMapping: contentStateAttributes,
		props: elementProps,
	});
};

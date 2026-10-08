'use no memo';

import { dataAttributes } from '../data-attributes';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { useRootContext } from './shared';

export type ContentProps = RenderProps<'div'>;

/**
 * groups toast content. `data-expanded` marks an expanded stack; `data-behind` marks a non-frontmost toast.
 *
 * @param props element props
 * @returns the content element; a `<div>` by default
 */
export const Content = ({ render, ref, ...elementProps }: ContentProps) => {
	const { expanded, behind } = useRootContext();

	return useRender({
		tag: 'div',
		render,
		refs: [ref],
		props: mergeProps<'div'>(dataAttributes({ expanded, behind }), elementProps),
	});
};

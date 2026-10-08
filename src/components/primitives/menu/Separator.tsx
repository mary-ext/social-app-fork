'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';

export type SeparatorProps = RenderProps<'div'>;

/**
 * divides groups of items.
 *
 * @param props element props
 * @returns the separator element; a `<div>` by default
 */
export const Separator = ({ render, ref, ...elementProps }: SeparatorProps) => {
	return useRender({
		tag: 'div',
		render,
		refs: [ref],
		props: mergeProps<'div'>({ role: 'separator' }, elementProps),
	});
};

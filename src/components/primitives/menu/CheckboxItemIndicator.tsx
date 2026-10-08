'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { useChecked } from './shared';

export type CheckboxItemIndicatorProps = RenderProps<'span'>;

/**
 * renders a decorative indicator while the enclosing checkbox item is checked.
 *
 * @param props element props
 * @returns the indicator element, a `<span>` by default, or `null`
 */
export const CheckboxItemIndicator = ({ render, ref, ...elementProps }: CheckboxItemIndicatorProps) => {
	const checked = useChecked();
	const element = useRender({
		tag: 'span',
		render,
		refs: [ref],
		props: mergeProps<'span'>({ 'aria-hidden': true }, elementProps),
	});
	return checked ? element : null;
};

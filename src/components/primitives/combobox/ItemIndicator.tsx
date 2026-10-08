'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { useItemSelected } from './shared';

export type ItemIndicatorProps = RenderProps<'span'>;

/**
 * renders a decorative indicator for the selected item.
 *
 * @param props element props
 * @returns a `<span>` by default, or `null` when unselected
 */
export const ItemIndicator = ({ render, ref, ...elementProps }: ItemIndicatorProps) => {
	const selected = useItemSelected();
	const element = useRender({
		tag: 'span',
		render,
		refs: [ref],
		props: mergeProps<'span'>({ 'aria-hidden': true }, elementProps),
	});
	return selected ? element : null;
};

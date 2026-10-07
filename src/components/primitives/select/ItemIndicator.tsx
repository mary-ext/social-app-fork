'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { useItemSelected } from './shared';

export type ItemIndicatorProps = useRender.ComponentProps<'span'>;

/**
 * renders a decorative indicator for the selected item.
 *
 * @param props element props
 * @returns the indicator element, a `<span>` by default, or `null`
 */
export const ItemIndicator = ({ render, ref, ...elementProps }: ItemIndicatorProps) => {
	const selected = useItemSelected();
	const element = useRender({
		render,
		ref,
		defaultTagName: 'span',
		enabled: selected,
		props: mergeProps<'span'>({ 'aria-hidden': true }, elementProps),
	});
	return selected ? element : null;
};

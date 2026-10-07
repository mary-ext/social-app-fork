'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { useChecked } from './shared';

export type CheckboxItemIndicatorProps = useRender.ComponentProps<'span'>;

/**
 * renders a decorative indicator while the enclosing checkbox item is checked.
 *
 * @param props element props
 * @returns the indicator element, a `<span>` by default, or `null`
 */
export const CheckboxItemIndicator = ({ render, ref, ...elementProps }: CheckboxItemIndicatorProps) => {
	const checked = useChecked();
	return useRender({
		render,
		ref,
		defaultTagName: 'span',
		enabled: checked,
		props: mergeProps<'span'>({ 'aria-hidden': true }, elementProps),
	});
};

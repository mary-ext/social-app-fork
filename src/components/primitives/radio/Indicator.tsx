'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '../merge-props';
import { getCheckedInputAttributes } from '../native-input';
import { type RenderProps, useRender } from '../render';
import { useRadioContext } from './shared';

export type IndicatorProps = RenderProps<'span'> & {
	/** keeps the indicator mounted while unchecked. */
	keepMounted?: boolean;
};

/**
 * shows that the radio is checked.
 *
 * @param props element props
 * @returns the indicator element; a `<span>` by default, or `null` while unchecked and unmounted
 * @throws if rendered outside `Root`
 */
export const Indicator = ({ render, ref, keepMounted = false, ...elementProps }: IndicatorProps) => {
	const state = useRadioContext();

	const element = useRender({
		tag: 'span',
		render,
		refs: [ref],
		props: mergeProps<'span'>(getCheckedInputAttributes(state), elementProps),
	});

	return state.checked || keepMounted ? element : null;
};

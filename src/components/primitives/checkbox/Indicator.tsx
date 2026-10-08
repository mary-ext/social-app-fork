'use no memo'; // composition props usually invalidate the generated wrapper caches

import { useRender } from '@base-ui/react/use-render';

import { type CheckboxState, getCheckboxStateAttributes, useCheckboxContext } from './shared';

export type IndicatorState = CheckboxState;

export type IndicatorProps = useRender.ComponentProps<'span', IndicatorState> & {
	/** keeps the indicator mounted while unchecked. */
	keepMounted?: boolean;
};

/**
 * shows that the checkbox is checked or indeterminate.
 *
 * @param props element props
 * @returns the indicator element; a `<span>` by default, or `null` while unchecked and unmounted
 * @throws if rendered outside `Root`
 */
export const Indicator = ({ render, ref, keepMounted = false, ...elementProps }: IndicatorProps) => {
	const state = useCheckboxContext();

	const element = useRender({
		render,
		defaultTagName: 'span',
		ref,
		state,
		stateAttributesMapping: getCheckboxStateAttributes(state),
		props: elementProps,
	});

	return state.checked || state.indeterminate || keepMounted ? element : null;
};

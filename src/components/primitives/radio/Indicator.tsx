'use no memo'; // composition props usually invalidate the generated wrapper caches

import { useRender } from '@base-ui/react/use-render';

import { type RadioState, radioStateAttributes, useRadioContext } from './shared';

export type IndicatorState = RadioState;

export type IndicatorProps = useRender.ComponentProps<'span', IndicatorState> & {
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
		render,
		defaultTagName: 'span',
		ref,
		state,
		stateAttributesMapping: radioStateAttributes,
		props: elementProps,
	});

	return state.checked || keepMounted ? element : null;
};

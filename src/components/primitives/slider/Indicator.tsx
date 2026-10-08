'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { type SliderState, sliderStateAttributes, useRootContext } from './shared';
import * as styles from './slider.css';

export type IndicatorState = SliderState;

export type IndicatorProps = useRender.ComponentProps<'div', IndicatorState>;

/**
 * fills the track from its minimum to the current value.
 *
 * @param props element props
 * @returns the indicator element; a `<div>` by default
 */
export const Indicator = ({ render, ref, ...elementProps }: IndicatorProps) => {
	const { state } = useRootContext();

	return useRender({
		render,
		ref,
		state,
		stateAttributesMapping: sliderStateAttributes,
		props: mergeProps<'div'>({ className: styles.indicator }, elementProps),
	});
};

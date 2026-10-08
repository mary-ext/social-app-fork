'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { getSliderAttributes, useRootContext } from './shared';
import * as styles from './slider.css';

export type IndicatorProps = RenderProps<'div'>;

/**
 * fills the track from its minimum to the current value.
 *
 * @param props element props
 * @returns the indicator element; a `<div>` by default
 */
export const Indicator = ({ render, ref, ...elementProps }: IndicatorProps) => {
	const { state } = useRootContext();

	return useRender({
		tag: 'div',
		render,
		refs: [ref],
		props: mergeProps<'div'>(getSliderAttributes(state), { className: styles.indicator }, elementProps),
	});
};

'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { type SliderState, sliderStateAttributes, useRootContext } from './shared';
import * as styles from './slider.css';

export type TrackState = SliderState;

export type TrackProps = useRender.ComponentProps<'div', TrackState>;

/**
 * spans the slider's full range and positions `Indicator` and `Thumb`.
 *
 * @param props element props
 * @returns the track element; a `<div>` by default
 */
export const Track = ({ render, ref, ...elementProps }: TrackProps) => {
	const { state } = useRootContext();

	return useRender({
		render,
		ref,
		state,
		stateAttributesMapping: sliderStateAttributes,
		props: mergeProps<'div'>({ className: styles.track }, elementProps),
	});
};

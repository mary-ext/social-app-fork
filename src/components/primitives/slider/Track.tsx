'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { getSliderAttributes, useRootContext } from './shared';
import * as styles from './slider.css';

export type TrackProps = RenderProps<'div'>;

/**
 * spans the slider's full range and positions `Indicator` and `Thumb`.
 *
 * @param props element props
 * @returns the track element; a `<div>` by default
 */
export const Track = ({ render, ref, ...elementProps }: TrackProps) => {
	const { state } = useRootContext();

	return useRender({
		tag: 'div',
		render,
		refs: [ref],
		props: mergeProps<'div'>(getSliderAttributes(state), { className: styles.track }, elementProps),
	});
};

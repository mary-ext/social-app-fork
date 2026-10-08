'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '../merge-props';
import { getCheckedInputAttributes } from '../native-input';
import { type RenderProps, useRender } from '../render';
import { useSwitchContext } from './shared';

export type ThumbProps = RenderProps<'span'>;

/**
 * the switch's movable part.
 *
 * @param props element props
 * @returns the thumb element; a `<span>` by default
 * @throws if rendered outside `Root`
 */
export const Thumb = ({ render, ref, ...elementProps }: ThumbProps) => {
	const state = useSwitchContext();

	return useRender({
		tag: 'span',
		render,
		refs: [ref],
		props: mergeProps<'span'>(getCheckedInputAttributes(state), elementProps),
	});
};

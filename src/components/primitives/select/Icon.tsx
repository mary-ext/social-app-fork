'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '../merge-props';
import { getOpenAttributes } from '../presence';
import { type RenderProps, useRender } from '../render';
import { useRootContext } from './shared';

export type IconProps = RenderProps<'span'>;

/**
 * renders a decorative trigger icon, hidden from assistive technology.
 *
 * @param props element props
 * @returns the icon element; a `<span>` by default
 */
export const Icon = ({ render, ref, ...elementProps }: IconProps) => {
	const { open } = useRootContext();
	return useRender({
		tag: 'span',
		render,
		refs: [ref],
		props: mergeProps<'span'>(getOpenAttributes(open), { 'aria-hidden': true }, elementProps),
	});
};

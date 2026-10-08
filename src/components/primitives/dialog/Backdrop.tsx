'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '../merge-props';
import { getOpenAttributes } from '../presence';
import { type RenderProps, useRender } from '../render';
import { useRootContext } from './shared';

export type BackdropProps = RenderProps<'div'>;

/**
 * renders the dialog backdrop inside `Viewport`.
 *
 * @param props element props
 * @returns the backdrop element; a `<div>` by default
 */
export const Backdrop = ({ render, ref, ...elementProps }: BackdropProps) => {
	const { open, backdropRef } = useRootContext();

	return useRender({
		tag: 'div',
		render,
		refs: [ref, backdropRef],
		props: mergeProps<'div'>(getOpenAttributes(open), { role: 'presentation' }, elementProps),
	});
};

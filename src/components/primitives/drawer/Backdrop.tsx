'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { openStateAttributes } from '../presence';
import { useRootContext } from './shared';

export type BackdropState = {
	open: boolean;
};

export type BackdropProps = useRender.ComponentProps<'div', BackdropState>;

/**
 * renders the drawer backdrop inside `Viewport`.
 *
 * @param props element props
 * @returns the backdrop element; a `<div>` by default
 */
export const Backdrop = ({ render, ref, ...elementProps }: BackdropProps) => {
	const { open, backdropRef } = useRootContext();

	return useRender({
		render,
		ref: [ref ?? null, backdropRef],
		state: { open },
		stateAttributesMapping: openStateAttributes,
		props: mergeProps<'div'>({ role: 'presentation' }, elementProps),
	});
};

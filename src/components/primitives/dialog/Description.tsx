'use no memo'; // composition props usually invalidate the generated wrapper caches

import { useLayoutEffect } from 'react';

import { type RenderProps, useRender } from '../render';
import { useRootContext } from './shared';

export type DescriptionProps = RenderProps<'p'>;

/**
 * describes the dialog.
 *
 * @param props element props
 * @returns the description element; a `<p>` by default
 */
export const Description = ({ render, ref, ...elementProps }: DescriptionProps) => {
	const { descriptionId, registerLabel } = useRootContext();

	useLayoutEffect(() => registerLabel('description'), [registerLabel]);

	return useRender({
		tag: 'p',
		render,
		refs: [ref],
		props: { ...elementProps, id: descriptionId },
	});
};

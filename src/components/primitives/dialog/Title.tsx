'use no memo'; // composition props usually invalidate the generated wrapper caches

import { useLayoutEffect } from 'react';

import { type RenderProps, useRender } from '../render';
import { useRootContext } from './shared';

export type TitleProps = RenderProps<'h2'>;

/**
 * names the dialog.
 *
 * @param props element props
 * @returns the title element; an `<h2>` by default
 */
export const Title = ({ render, ref, ...elementProps }: TitleProps) => {
	const { titleId, registerLabel } = useRootContext();

	useLayoutEffect(() => registerLabel('title'), [registerLabel]);

	return useRender({
		tag: 'h2',
		render,
		refs: [ref],
		props: { ...elementProps, id: titleId },
	});
};

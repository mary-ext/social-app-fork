'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { RowContext } from './shared';

export type RowProps = RenderProps<'div'>;

/**
 * a row of grid items. requires `grid` on the root.
 *
 * @param props element props
 * @returns the row element; a `<div>` by default
 */
export const Row = ({ render, ref, ...elementProps }: RowProps) => {
	const element = useRender({
		tag: 'div',
		render,
		refs: [ref],
		props: mergeProps<'div'>({ role: 'row' }, elementProps),
	});

	return <RowContext value>{element}</RowContext>;
};

'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { RowContext } from './shared';

export type RowProps = useRender.ComponentProps<'div'>;

/**
 * a row of grid items. requires `grid` on the root.
 *
 * @param props element props
 * @returns the row element; a `<div>` by default
 */
export const Row = ({ render, ref, ...elementProps }: RowProps) => {
	const element = useRender({
		render,
		ref,
		props: mergeProps<'div'>({ role: 'row' }, elementProps),
	});

	return <RowContext value>{element}</RowContext>;
};

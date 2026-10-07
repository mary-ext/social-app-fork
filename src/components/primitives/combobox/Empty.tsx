'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { useRootContext } from './shared';

export type EmptyProps = useRender.ComponentProps<'div'>;

/**
 * announces its children when there are no items.
 *
 * @param props element props
 * @returns the status element; a `<div>` by default
 */
export const Empty = ({ render, ref, children, ...elementProps }: EmptyProps) => {
	const { items } = useRootContext();

	// keep the live region mounted so changes to its content are announced.
	return useRender({
		render,
		ref,
		props: mergeProps<'div'>(
			{
				role: 'status',
				'aria-live': 'polite',
				'aria-atomic': true,
				children: items.length === 0 ? children : null,
			},
			elementProps,
		),
	});
};

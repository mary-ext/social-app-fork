'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

export type SeparatorProps = useRender.ComponentProps<'div'>;

/**
 * divides groups of items.
 *
 * @param props element props
 * @returns the separator element; a `<div>` by default
 */
export const Separator = ({ render, ref, ...elementProps }: SeparatorProps) => {
	return useRender({
		render,
		ref,
		props: mergeProps<'div'>({ role: 'separator' }, elementProps),
	});
};

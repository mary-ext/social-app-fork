'use no memo'; // composition props usually invalidate the generated wrapper caches

import { useLayoutEffect } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { useGroupContext } from './shared';

export type GroupLabelProps = useRender.ComponentProps<'div'>;

/**
 * names the enclosing group.
 *
 * @param props element props
 * @returns the label element; a `<div>` by default
 */
export const GroupLabel = ({ render, ref, ...elementProps }: GroupLabelProps) => {
	const { labelId, registerLabel } = useGroupContext();

	useLayoutEffect(registerLabel, [registerLabel]);

	return useRender({
		render,
		ref,
		props: mergeProps<'div'>({ id: labelId }, elementProps),
	});
};

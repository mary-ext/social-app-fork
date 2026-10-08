'use no memo'; // composition props usually invalidate the generated wrapper caches

import { useLayoutEffect } from 'react';

import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { useGroupContext } from './shared';

export type GroupLabelProps = RenderProps<'div'>;

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
		tag: 'div',
		render,
		refs: [ref],
		props: mergeProps<'div'>({ id: labelId }, elementProps),
	});
};

'use no memo';

import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { useRootContext } from './shared';

export type ActionProps = RenderProps<'button'>;

/**
 * renders the toast's action button with its `actionProps`.
 *
 * @param props element props
 * @returns a `<button>` by default, or `null` without children
 */
export const Action = ({ render, ref, ...elementProps }: ActionProps) => {
	const { toast } = useRootContext();
	const props = mergeProps<'button'>({ type: 'button' }, elementProps, toast.actionProps);

	const element = useRender({
		tag: 'button',
		render,
		refs: [ref],
		props,
	});

	return props.children != null ? element : null;
};

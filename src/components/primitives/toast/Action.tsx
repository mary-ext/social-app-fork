'use no memo';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { useRootContext } from './shared';

export type ActionProps = useRender.ComponentProps<'button'>;

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
		render,
		ref,
		defaultTagName: 'button',
		props,
	});

	return props.children != null ? element : null;
};

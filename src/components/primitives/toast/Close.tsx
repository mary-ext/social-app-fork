'use no memo';

import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { useProviderContext, useRootContext } from './shared';

export type CloseProps = RenderProps<'button'>;

/**
 * closes the toast when pressed.
 *
 * @param props element props
 * @returns the close element; a `<button>` by default
 */
export const Close = ({ render, ref, ...elementProps }: CloseProps) => {
	const { manager } = useProviderContext();
	const { toast } = useRootContext();

	return useRender({
		tag: 'button',
		render,
		refs: [ref],
		props: mergeProps<'button'>(
			{
				type: 'button',
				onClick() {
					manager.close(toast.id);
				},
			},
			elementProps,
		),
	});
};

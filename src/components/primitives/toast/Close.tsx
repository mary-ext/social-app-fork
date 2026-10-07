'use no memo';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { useProviderContext, useRootContext } from './shared';

export type CloseProps = useRender.ComponentProps<'button'>;

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
		render,
		ref,
		defaultTagName: 'button',
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

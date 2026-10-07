'use no memo'; // composition props usually invalidate the generated wrapper caches

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { useRootContext } from './shared';

export type CloseProps = useRender.ComponentProps<'button'>;

/**
 * closes the popover when pressed.
 *
 * @param props element props
 * @returns the close element; a `<button>` by default
 */
export const Close = ({ render, ref, ...elementProps }: CloseProps) => {
	const { setOpen } = useRootContext();

	return useRender({
		render,
		ref,
		defaultTagName: 'button',
		props: mergeProps<'button'>(
			{
				type: 'button',
				onClick(event) {
					setOpen(false, { reason: 'close-press', event: event.nativeEvent });
				},
			},
			elementProps,
		),
	});
};

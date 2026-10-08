'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { ButtonHTMLAttributes } from 'react';

import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { useRootContext } from './shared';

export type CloseProps = RenderProps<'button'>;

/**
 * closes the dialog when pressed.
 *
 * @param props element props
 * @returns the close element; a `<button>` by default
 */
export const Close = ({ render, ref, ...elementProps }: CloseProps) => {
	const { setOpen } = useRootContext();

	const internalProps: ButtonHTMLAttributes<HTMLButtonElement> = {
		type: 'button',
		onClick(event) {
			setOpen(false, { reason: 'close-press', event: event.nativeEvent });
		},
	};

	return useRender({
		tag: 'button',
		render,
		refs: [ref],
		props: mergeProps<'button'>(internalProps, elementProps),
	});
};

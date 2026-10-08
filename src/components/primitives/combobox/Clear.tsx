'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { ButtonHTMLAttributes } from 'react';

import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { useRootContext } from './shared';

export type ClearProps = RenderProps<'button'>;

/**
 * empties the input and refocuses it. shown while the input has text, outside the tab order.
 *
 * @param props element props
 * @returns the button element, or `null` while the input is empty
 */
export const Clear = ({ render, ref, ...elementProps }: ClearProps) => {
	const ctx = useRootContext();
	const visible = ctx.inputValue !== '';

	const internalProps: ButtonHTMLAttributes<HTMLButtonElement> = {
		type: 'button',
		tabIndex: -1,
		onMouseDown(event) {
			event.preventDefault();
		},
		onClick(event) {
			ctx.setInputValue('', { reason: 'clear-press', event: event.nativeEvent });
			ctx.inputRef.current?.focus();
		},
	};

	const element = useRender({
		tag: 'button',
		render,
		refs: [ref],
		props: mergeProps<'button'>(internalProps, elementProps),
	});
	return visible ? element : null;
};

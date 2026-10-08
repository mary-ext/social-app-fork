'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { ButtonHTMLAttributes } from 'react';

import { flushSync } from 'react-dom';

import { dataAttributes } from '../data-attributes';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { useRootContext } from './shared';

export type ToggleProps = Omit<RenderProps<'button'>, 'disabled' | 'form' | 'type' | 'value'>;

/**
 * toggles visibility; `aria-pressed` reports the state. use a fixed label, e.g. "Show password". activation
 * preserves input focus and selection if the input is focused.
 *
 * @param props element props
 * @returns the toggle element; a `<button>` by default
 * @throws if rendered outside `Root`
 */
export const Toggle = ({ render, ref, ...elementProps }: ToggleProps) => {
	const { visible, disabled, inputId, inputRef, setVisible } = useRootContext();

	const internalProps: ButtonHTMLAttributes<HTMLButtonElement> = {
		type: 'button',
		disabled,
		'aria-controls': inputId,
		'aria-pressed': visible,
		onMouseDown(event) {
			if (getFocusedInput(inputRef.current)) {
				// keep the on-screen keyboard open.
				event.preventDefault();
			}
		},
		onClick(event) {
			if (event.defaultPrevented) {
				return;
			}

			const input = getFocusedInput(inputRef.current);
			const { selectionStart, selectionEnd, selectionDirection } = input ?? {};

			// changing `type` can move the caret; restore it after the DOM update.
			const changed = flushSync(() => setVisible(!visible, 'toggle-press', event.nativeEvent));

			if (changed && input && selectionStart != null && selectionEnd != null) {
				input.setSelectionRange(selectionStart, selectionEnd, selectionDirection ?? undefined);
			}
		},
	};

	return useRender({
		tag: 'button',
		render,
		refs: [ref],
		// oxlint-disable-next-line react/refs -- the handlers only read refs when events fire
		props: mergeProps<'button'>(dataAttributes({ visible, disabled }), internalProps, elementProps),
	});
};

const getFocusedInput = (input: HTMLInputElement | null): HTMLInputElement | null => {
	return input !== null && input === input.ownerDocument.activeElement ? input : null;
};

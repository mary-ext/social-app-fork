'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { ButtonHTMLAttributes } from 'react';

import { focusableDisabledGuard, useCompositeItem } from '../composite';
import { dataAttributes } from '../data-attributes';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { useRootContext, useToolbarDisabled } from './shared';

export type ButtonProps = RenderProps<'button'> & {
	/** blocks activation. */
	disabled?: boolean;
	/**
	 * uses `aria-disabled` to keep disabled buttons reachable with arrow keys.
	 *
	 * @default true
	 */
	focusableWhenDisabled?: boolean;
	/**
	 * whether `render` produces a `<button>`.
	 *
	 * @default true
	 */
	nativeButton?: boolean;
};

/**
 * a button in the toolbar's navigation.
 *
 * @param props behavior and element props
 * @returns the button element; a `<button>` by default
 * @throws if rendered outside `Root`
 */
export const Button = ({
	render,
	ref,
	disabled: disabledProp = false,
	focusableWhenDisabled = true,
	nativeButton = true,
	...elementProps
}: ButtonProps) => {
	const { orientation } = useRootContext();
	const disabled = useToolbarDisabled() || disabledProp;
	const item = useCompositeItem({ active: false, disabled });
	const focusable = focusableWhenDisabled || !nativeButton;

	const internalProps: ButtonHTMLAttributes<HTMLButtonElement> = {
		...item,
		type: nativeButton ? 'button' : undefined,
		disabled: (disabled && !focusable) || undefined,
		'aria-disabled': (disabled && focusable) || undefined,
	};

	return useRender({
		tag: 'button',
		render,
		refs: [ref],
		props: mergeProps<'button'>(
			dataAttributes({ disabled, focusable, orientation }),
			internalProps,
			elementProps,
			disabled && focusable ? focusableDisabledGuard : undefined,
		),
	});
};

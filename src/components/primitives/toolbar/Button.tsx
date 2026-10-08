'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { ButtonHTMLAttributes } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { focusableDisabledGuard, useCompositeItem } from '../composite';
import { type Orientation, useRootContext, useToolbarDisabled } from './shared';

export type ButtonState = {
	disabled: boolean;
	focusable: boolean;
	orientation: Orientation;
};

export type ButtonProps = useRender.ComponentProps<'button', ButtonState> & {
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
		render,
		defaultTagName: 'button',
		ref,
		state: { disabled, focusable, orientation },
		props: mergeProps<'button'>(
			internalProps,
			elementProps,
			disabled && focusable ? focusableDisabledGuard : undefined,
		),
	});
};

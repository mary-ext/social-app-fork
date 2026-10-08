'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type ButtonHTMLAttributes, useContext, useId } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { useControlled } from '@base-ui/utils/useControlled';

import { createChangeDetails } from '../change-details';
import { focusableDisabledGuard, useCompositeItem } from '../composite';
import { useToolbarDisabled } from '../toolbar/shared';
import { GroupContext, type PressedChangeDetails } from './shared';

export type RootState = {
	pressed: boolean;
	disabled: boolean;
};

export type RootProps = Omit<useRender.ComponentProps<'button', RootState>, 'form' | 'type' | 'value'> & {
	/** controlled pressed state; ignored inside a group. */
	pressed?: boolean;
	/** initial uncontrolled pressed state; ignored inside a group. */
	defaultPressed?: boolean;
	/** receives pressed-state change requests. */
	onPressedChange?: (pressed: boolean, details: PressedChangeDetails) => void;
	/** blocks activation. */
	disabled?: boolean;
	/** identifies the toggle within a group; empty values fall back to a generated one. */
	value?: string;
	/**
	 * whether `render` produces a `<button>`; non-buttons use `aria-disabled`.
	 *
	 * @default true
	 */
	nativeButton?: boolean;
};

/**
 * a two-state button, standalone or within a `Group`.
 *
 * @param props state and element props
 * @returns the toggle element; a `<button>` by default
 */
export const Root = ({
	render,
	ref,
	pressed: pressedProp,
	defaultPressed = false,
	onPressedChange,
	disabled: disabledProp = false,
	value: valueProp,
	nativeButton = true,
	...elementProps
}: RootProps) => {
	const group = useContext(GroupContext);
	const toolbarDisabled = useToolbarDisabled();
	const fallbackValue = useId();
	const value = valueProp || fallbackValue;

	const [pressedState, setPressedState] = useControlled({
		controlled: pressedProp,
		default: defaultPressed,
		name: 'Toggle',
		state: 'pressed',
	});
	const pressed = group ? group.value.includes(value) : pressedState;
	const disabled = disabledProp || (group?.disabled ?? toolbarDisabled);

	const item = useCompositeItem({ active: false, disabled });

	const internalProps: ButtonHTMLAttributes<HTMLButtonElement> = {
		...item,
		type: nativeButton ? 'button' : undefined,
		disabled: (nativeButton && disabled) || undefined,
		'aria-disabled': (!nativeButton && disabled) || undefined,
		'aria-pressed': pressed,
		onClick(event) {
			const details = createChangeDetails('none', event.nativeEvent);
			onPressedChange?.(!pressed, details);
			if (details.isCanceled) {
				return;
			}

			if (group) {
				group.setGroupValue(value, !pressed, details);
			} else {
				setPressedState(!pressed);
			}
		},
	};

	return useRender({
		render,
		defaultTagName: 'button',
		ref,
		state: { pressed, disabled },
		props: mergeProps<'button'>(
			internalProps,
			elementProps,
			!nativeButton && disabled ? focusableDisabledGuard : undefined,
		),
	});
};

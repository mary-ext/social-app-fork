'use no memo'; // composition props usually invalidate the generated wrapper caches

import {
	type AriaAttributes,
	type HTMLAttributes,
	type InputHTMLAttributes,
	type KeyboardEvent,
	type KeyboardEventHandler,
	useLayoutEffect,
	useRef,
} from 'react';

import { focusWithVisibility } from '../focus';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { getSliderAttributes, useRootContext, type ValueChangeReason } from './shared';
import * as styles from './slider.css';

type InputAriaProps = 'aria-describedby' | 'aria-label' | 'aria-labelledby';

export type ThumbProps = Omit<RenderProps<'div'>, InputAriaProps | 'onKeyDown' | 'tabIndex'> &
	Pick<AriaAttributes, InputAriaProps> & {
		/** returns `aria-valuetext` for a value. */
		getAriaValueText?: (value: number) => string;
		/** call `preventDefault()` to override built-in key handling. */
		onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
		tabIndex?: number;
	};

/**
 * the draggable handle. its hidden range input receives focus, ARIA labels, `tabIndex`, and `onKeyDown`.
 *
 * @param props element and input props
 * @returns the thumb element; a `<div>` by default
 */
export const Thumb = ({
	render,
	ref,
	children,
	'aria-describedby': ariaDescribedBy,
	'aria-label': ariaLabel,
	'aria-labelledby': ariaLabelledBy,
	getAriaValueText,
	onKeyDown,
	tabIndex,
	...elementProps
}: ThumbProps) => {
	const { state, min, max, step, largeStep, thumbRef, inputRef, setValue, commitValue } = useRootContext();
	const { value, disabled, orientation } = state;

	const refocusingRef = useRef(false);

	// Firefox and Safari keep focus on inputs that become disabled.
	useLayoutEffect(() => {
		if (disabled && inputRef.current === document.activeElement) {
			inputRef.current?.blur();
		}
	}, [disabled, inputRef]);

	const changeAndCommit = (next: number, reason: ValueChangeReason, event: Event) => {
		const applied = setValue(next, reason, event);
		if (applied !== null) {
			commitValue(applied, reason, event);
		}
	};

	const getKeyboardValue = (event: KeyboardEvent<HTMLInputElement>): number | null => {
		const increment = event.shiftKey ? largeStep : step;
		const forward = event.currentTarget.matches(':dir(rtl)') ? -increment : increment;

		switch (event.key) {
			case 'ArrowUp': {
				return value + increment;
			}
			case 'ArrowDown': {
				return value - increment;
			}
			case 'ArrowRight': {
				return value + forward;
			}
			case 'ArrowLeft': {
				return value - forward;
			}
			case 'PageUp': {
				return value + largeStep;
			}
			case 'PageDown': {
				return value - largeStep;
			}
			case 'Home': {
				return min;
			}
			case 'End': {
				return max;
			}
		}
		return null;
	};

	// suppress containing popovers' focus-out dismissal during the blur/focus pair.
	const restoreFocusVisible = (input: HTMLInputElement) => {
		refocusingRef.current = true;
		focusWithVisibility(input, { focusVisible: true, preventScroll: true });
		refocusingRef.current = false;
	};

	const internalInputProps: InputHTMLAttributes<HTMLInputElement> = {
		className: styles.input,
		type: 'range',
		min,
		max,
		step,
		value,
		disabled,
		tabIndex,
		'aria-describedby': ariaDescribedBy,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledBy,
		'aria-orientation': orientation,
		'aria-valuetext': getAriaValueText?.(value),
		onFocus(event) {
			if (refocusingRef.current) {
				event.stopPropagation();
			}
		},
		onBlur(event) {
			if (refocusingRef.current) {
				event.stopPropagation();
			}
		},
		// assistive technology may adjust the input directly.
		onChange(event) {
			changeAndCommit(event.currentTarget.valueAsNumber, 'input-change', event.nativeEvent);
		},
		onKeyDown(event) {
			const next = getKeyboardValue(event);
			// restore the ring even when the caller handles the key.
			if (next === null && !event.defaultPrevented) {
				return;
			}

			restoreFocusVisible(event.currentTarget);
			if (next === null || event.defaultPrevented) {
				return;
			}

			// prevent the native input from applying a second step.
			event.preventDefault();
			event.stopPropagation();
			changeAndCommit(next, 'keyboard', event.nativeEvent);
		},
	};

	const internalProps: HTMLAttributes<HTMLDivElement> = {
		className: styles.thumb,
		children: (
			<>
				{children}
				{/* oxlint-disable-next-line react/refs -- the handlers only read refs when events fire */}
				<input ref={inputRef} {...mergeProps<'input'>(internalInputProps, { onKeyDown })} />
			</>
		),
	};

	return useRender({
		tag: 'div',
		render,
		refs: [ref, thumbRef],
		props: mergeProps<'div'>(getSliderAttributes(state), internalProps, elementProps),
	});
};

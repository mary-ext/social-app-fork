'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { AriaAttributes, InputHTMLAttributes, LabelHTMLAttributes, Ref } from 'react';

import { type DataAttributes, dataAttributes } from './data-attributes';
import { mergeProps } from './merge-props';
import * as styles from './native-input.css';
import { type RenderProps, useRender } from './render';

type InputAriaProps = 'aria-describedby' | 'aria-label' | 'aria-labelledby';

export type NativeInputState = {
	disabled: boolean;
	readOnly: boolean;
	required: boolean;
};

/**
 * shared checkbox, radio, and switch props. `render` must produce a `<label>`. `id` and ARIA labels target
 * the input; style root focus with `:has(> input:focus-visible)`.
 */
export type NativeInputRootProps = Omit<
	RenderProps<'label'>,
	InputAriaProps | 'defaultChecked' | 'form' | 'id' | 'onChange' | 'value'
> &
	Pick<AriaAttributes, InputAriaProps> & {
		/** prevents focus and changes. */
		disabled?: boolean;
		/** keeps the control focusable but ignores changes. */
		readOnly?: boolean;
		/** requires a checked control for form submission. */
		required?: boolean;
		/** id of the native input, for external labels. */
		id?: string;
	};

export type CheckedState = {
	checked: boolean;
};

/**
 * @param state control state
 * @returns `data-disabled`, `data-readonly`, and `data-required` when set
 */
export const getNativeInputAttributes = ({
	disabled,
	readOnly,
	required,
}: NativeInputState): DataAttributes => {
	return dataAttributes({ disabled, readonly: readOnly, required });
};

/**
 * @param state control state
 * @returns `data-checked` or `data-unchecked`, plus native-input state attributes
 */
export const getCheckedInputAttributes = (state: CheckedState & NativeInputState): DataAttributes => {
	return {
		...dataAttributes({ checked: state.checked, unchecked: !state.checked }),
		...getNativeInputAttributes(state),
	};
};

/**
 * renders a label root with a visually hidden native input.
 *
 * @param props root attributes and children
 * @param options control state, root state attributes, and input props
 * @returns the root element
 */
export const useNativeInputRoot = (
	{
		render,
		ref,
		children,
		id,
		'aria-describedby': ariaDescribedBy,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledBy,
		...elementProps
	}: Omit<NativeInputRootProps, keyof NativeInputState>,
	{
		state,
		attributes,
		input,
	}: {
		state: NativeInputState;
		attributes: DataAttributes;
		input: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> };
	},
) => {
	const inputProps: InputHTMLAttributes<HTMLInputElement> = {
		className: styles.input,
		id,
		disabled: state.disabled,
		required: state.required,
		'aria-describedby': ariaDescribedBy,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledBy,
		onClick(event) {
			// canceling restores checked state, including radio arrow-key selection.
			if (state.readOnly) {
				event.preventDefault();
			}
		},
	};

	const internalProps: LabelHTMLAttributes<HTMLLabelElement> = {
		className: styles.root,
		children: (
			<>
				<input {...mergeProps<'input'>(inputProps, input)} />
				{children}
			</>
		),
	};

	return useRender({
		tag: 'label',
		render,
		refs: [ref],
		props: mergeProps<'label'>(attributes, internalProps, elementProps),
	});
};

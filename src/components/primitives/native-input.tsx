'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { AriaAttributes, InputHTMLAttributes, LabelHTMLAttributes, Ref } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import * as styles from './native-input.css';

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
export type NativeInputRootProps<State> = Omit<
	useRender.ComponentProps<'label', State>,
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

export const checkedStateAttributes = {
	checked: (checked: boolean): Record<string, string> =>
		checked ? { 'data-checked': '' } : { 'data-unchecked': '' },
};

/**
 * renders a label root with a visually hidden native input.
 *
 * @param props root attributes and children
 * @param options control state, attribute mapping, and input props
 * @returns the root element
 */
export const useNativeInputRoot = <State extends NativeInputState>(
	{
		render,
		ref,
		children,
		id,
		'aria-describedby': ariaDescribedBy,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledBy,
		...elementProps
	}: Omit<NativeInputRootProps<State>, keyof NativeInputState>,
	{
		state,
		stateAttributesMapping,
		input,
	}: {
		state: State;
		stateAttributesMapping?: useRender.Parameters<
			State,
			HTMLLabelElement,
			undefined
		>['stateAttributesMapping'];
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
		render,
		defaultTagName: 'label',
		ref,
		state,
		stateAttributesMapping,
		props: mergeProps<'label'>(internalProps, elementProps),
	});
};

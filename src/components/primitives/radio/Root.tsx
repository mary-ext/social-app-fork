'use no memo'; // composition props usually invalidate the generated wrapper caches

import {
	type AriaAttributes,
	type InputHTMLAttributes,
	type LabelHTMLAttributes,
	useLayoutEffect,
	useRef,
} from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import * as styles from './radio.css';
import { RadioContext, type RadioState, radioStateAttributes, useGroupContext } from './shared';

export type RootState = RadioState;

type InputAriaProps = 'aria-describedby' | 'aria-label' | 'aria-labelledby';

export type RootProps = Omit<useRender.ComponentProps<'label', RootState>, InputAriaProps | 'id' | 'value'> &
	Pick<AriaAttributes, InputAriaProps> & {
		/** the group's value while this radio is checked. */
		value: unknown;
		/** prevents checking this radio. */
		disabled?: boolean;
		/** keeps the radio focusable but ignores changes. */
		readOnly?: boolean;
		/** requires a checked radio for form submission. */
		required?: boolean;
		/** id of the radio input, for external labels. */
		id?: string;
	};

/**
 * a radio choice. the native input receives focus, ARIA labels, and `id`; use `:has(> input:focus-visible)`
 * to style the `<label>` root's focus ring.
 *
 * @param props value and element props
 * @returns the root element; must remain a `<label>`
 * @throws if rendered outside `Group`
 */
export const Root = ({
	render,
	ref,
	children,
	value,
	disabled: disabledProp = false,
	readOnly: readOnlyProp = false,
	required: requiredProp = false,
	id,
	'aria-describedby': ariaDescribedBy,
	'aria-label': ariaLabel,
	'aria-labelledby': ariaLabelledBy,
	...elementProps
}: RootProps) => {
	const group = useGroupContext();
	const inputRef = useRef<HTMLInputElement | null>(null);

	const checked = Object.is(group.value, value);
	const state: RadioState = {
		checked,
		disabled: group.disabled || disabledProp,
		readOnly: group.readOnly || readOnlyProp,
		required: group.required || requiredProp,
	};

	// rejected changes need an explicit reset: the browser already unchecked the previous radio.
	useLayoutEffect(() => {
		const input = inputRef.current;
		if (input && input.checked !== checked) {
			input.checked = checked;
		}
		// oxlint-disable-next-line react/exhaustive-effect-dependencies -- each change attempt re-syncs
	}, [checked, group.revision]);

	const inputProps: InputHTMLAttributes<HTMLInputElement> = {
		className: styles.input,
		type: 'radio',
		id,
		name: group.name,
		form: group.form,
		value: typeof value === 'string' || typeof value === 'number' ? value : undefined,
		checked,
		disabled: state.disabled,
		required: state.required,
		'aria-describedby': ariaDescribedBy,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledBy,
		onClick(event) {
			// canceling the click also restores the checked state after arrow-key selection.
			if (state.readOnly) {
				event.preventDefault();
			}
		},
		onChange(event) {
			if (event.currentTarget.checked) {
				group.setValue(value, event.nativeEvent);
			}
		},
	};

	const internalProps: LabelHTMLAttributes<HTMLLabelElement> = {
		className: styles.root,
		children: (
			<>
				{/* oxlint-disable-next-line react/refs -- the handlers only read refs when events fire */}
				<input ref={inputRef} {...inputProps} />
				{children}
			</>
		),
	};

	const element = useRender({
		render,
		defaultTagName: 'label',
		ref,
		state,
		stateAttributesMapping: radioStateAttributes,
		props: mergeProps<'label'>(internalProps, elementProps),
	});

	return <RadioContext.Provider value={state}>{element}</RadioContext.Provider>;
};

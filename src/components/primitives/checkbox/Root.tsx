'use no memo'; // composition props usually invalidate the generated wrapper caches

import { useContext, useLayoutEffect, useRef } from 'react';

import { useControlled } from '#/lib/hooks/use-controlled';

import { createChangeDetails } from '../change-details';
import { type NativeInputRootProps, useNativeInputRoot } from '../native-input';
import {
	CheckboxContext,
	type CheckboxState,
	type CheckedChangeDetails,
	getCheckboxAttributes,
	GroupContext,
} from './shared';

export type RootProps = NativeInputRootProps & {
	/** controlled checked state; ignored inside a group. */
	checked?: boolean;
	/** initial uncontrolled checked state; ignored inside a group. */
	defaultChecked?: boolean;
	/** receives change requests before the group's `onValueChange`; canceling stops the change. */
	onCheckedChange?: (checked: boolean, details: CheckedChangeDetails) => void;
	/** shows a mixed state; the next change still toggles `checked`. */
	indeterminate?: boolean;
	/** identifies the checkbox within a group, and is submitted with forms while checked. */
	value?: string;
	/** form field name. */
	name?: string;
	/** id of the form the checkbox belongs to. */
	form?: string;
};

/**
 * a checkbox, standalone or within a `Group`.
 *
 * @param props state and element props
 * @returns the label root
 * @throws if rendered inside a `Group` without a `value`
 */
export const Root = ({
	checked: checkedProp,
	defaultChecked = false,
	onCheckedChange,
	indeterminate = false,
	disabled = false,
	readOnly = false,
	required = false,
	value,
	name,
	form,
	...rootProps
}: RootProps) => {
	const group = useContext(GroupContext);
	if (group && value === undefined) {
		throw new Error(`checkboxes inside <Checkbox.Group> require a value`);
	}

	const inputRef = useRef<HTMLInputElement | null>(null);

	const [checkedState, setCheckedState] = useControlled({
		controlled: checkedProp,
		default: defaultChecked,
	});
	const checked = group && value !== undefined ? group.value.includes(value) : checkedState;

	const state: CheckboxState = {
		checked,
		indeterminate,
		disabled: disabled || (group?.disabled ?? false),
		readOnly,
		required,
	};

	// `indeterminate` has no HTML attribute.
	useLayoutEffect(() => {
		const input = inputRef.current;
		if (input) {
			input.indeterminate = indeterminate;
		}
	}, [indeterminate]);

	const element = useNativeInputRoot(rootProps, {
		state,
		attributes: getCheckboxAttributes(state),
		input: {
			ref: inputRef,
			type: 'checkbox',
			name,
			form,
			value,
			checked,
			onChange(event) {
				const input = event.currentTarget;
				const next = input.checked;
				// native activation clears `indeterminate`; keep it controlled by the prop.
				input.indeterminate = indeterminate;

				const details = createChangeDetails('none', event.nativeEvent);
				onCheckedChange?.(next, details);
				if (details.isCanceled) {
					return;
				}

				if (group && value !== undefined) {
					group.setGroupValue(value, next, details);
				} else {
					setCheckedState(next);
				}
			},
		},
	});

	return <CheckboxContext.Provider value={state}>{element}</CheckboxContext.Provider>;
};

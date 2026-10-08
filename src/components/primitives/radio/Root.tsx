'use no memo'; // composition props usually invalidate the generated wrapper caches

import { useLayoutEffect, useRef } from 'react';

import { getCheckedInputAttributes, type NativeInputRootProps, useNativeInputRoot } from '../native-input';
import { RadioContext, type RadioState, useGroupContext } from './shared';

export type RootProps = NativeInputRootProps & {
	/** the group's value while this radio is checked. */
	value: unknown;
};

/**
 * a radio choice within a `Group`.
 *
 * @param props value and element props
 * @returns the label root
 * @throws if rendered outside `Group`
 */
export const Root = ({
	value,
	disabled = false,
	readOnly = false,
	required = false,
	...rootProps
}: RootProps) => {
	const group = useGroupContext();
	const inputRef = useRef<HTMLInputElement | null>(null);

	const checked = Object.is(group.value, value);
	const state: RadioState = {
		checked,
		disabled: group.disabled || disabled,
		readOnly: group.readOnly || readOnly,
		required: group.required || required,
	};
	const attributes = getCheckedInputAttributes(state);

	// rejected changes need an explicit reset: the browser already unchecked the previous radio.
	useLayoutEffect(() => {
		const input = inputRef.current;
		if (input && input.checked !== checked) {
			input.checked = checked;
		}
		// oxlint-disable-next-line react/exhaustive-effect-dependencies -- each change attempt re-syncs
	}, [checked, group.revision]);

	const element = useNativeInputRoot(rootProps, {
		state,
		attributes,
		input: {
			ref: inputRef,
			type: 'radio',
			name: group.name,
			form: group.form,
			value: typeof value === 'string' || typeof value === 'number' ? value : undefined,
			checked,
			onChange(event) {
				if (event.currentTarget.checked) {
					group.setValue(value, event.nativeEvent);
				}
			},
		},
	});

	return <RadioContext.Provider value={state}>{element}</RadioContext.Provider>;
};

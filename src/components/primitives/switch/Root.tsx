'use no memo'; // composition props usually invalidate the generated wrapper caches

import { useControlled } from '#/lib/hooks/use-controlled';

import { createChangeDetails } from '../change-details';
import { getCheckedInputAttributes, type NativeInputRootProps, useNativeInputRoot } from '../native-input';
import { type CheckedChangeDetails, SwitchContext, type SwitchState } from './shared';

export type RootProps = NativeInputRootProps & {
	/** controlled checked state. */
	checked?: boolean;
	/** initial uncontrolled checked state. */
	defaultChecked?: boolean;
	/** receives cancellable checked-state change requests. */
	onCheckedChange?: (checked: boolean, details: CheckedChangeDetails) => void;
	/** submitted with forms while on. */
	value?: string;
	/** form field name. */
	name?: string;
	/** id of the form the switch belongs to. */
	form?: string;
};

/**
 * an on/off switch.
 *
 * @param props state and element props
 * @returns the label root
 */
export const Root = ({
	checked: checkedProp,
	defaultChecked = false,
	onCheckedChange,
	disabled = false,
	readOnly = false,
	required = false,
	value,
	name,
	form,
	...rootProps
}: RootProps) => {
	const [checked, setCheckedState] = useControlled({
		controlled: checkedProp,
		default: defaultChecked,
	});

	const state: SwitchState = { checked, disabled, readOnly, required };

	const element = useNativeInputRoot(rootProps, {
		state,
		attributes: getCheckedInputAttributes(state),
		input: {
			type: 'checkbox',
			role: 'switch',
			name,
			form,
			value,
			checked,
			onChange(event) {
				const next = event.currentTarget.checked;
				const details = createChangeDetails('none', event.nativeEvent);
				onCheckedChange?.(next, details);
				if (!details.isCanceled) {
					setCheckedState(next);
				}
			},
		},
	});

	return <SwitchContext.Provider value={state}>{element}</SwitchContext.Provider>;
};

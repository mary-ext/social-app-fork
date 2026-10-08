import { createContext, useContext } from 'react';

import type { ChangeDetails } from '../change-details';
import { type DataAttributes, dataAttributes } from '../data-attributes';
import {
	type CheckedState,
	getCheckedInputAttributes,
	getNativeInputAttributes,
	type NativeInputState,
} from '../native-input';

export type CheckedChangeDetails = ChangeDetails<'none'>;

export type GroupContextValue = {
	value: readonly string[];
	disabled: boolean;
	/**
	 * @param value the checkbox's value
	 * @param checked requested checked state
	 * @param details shared change details
	 */
	setGroupValue: (value: string, checked: boolean, details: CheckedChangeDetails) => void;
};

export const GroupContext = createContext<GroupContextValue | null>(null);
GroupContext.displayName = 'CheckboxGroupContext';

export type CheckboxState = CheckedState &
	NativeInputState & {
		indeterminate: boolean;
	};

export const CheckboxContext = createContext<CheckboxState | null>(null);
CheckboxContext.displayName = 'CheckboxContext';

/**
 * @returns the enclosing checkbox's state
 * @throws if called outside `Checkbox.Root`
 */
export const useCheckboxContext = (): CheckboxState => {
	const ctx = useContext(CheckboxContext);
	if (ctx === null) {
		throw new Error(`checkbox parts require <Checkbox.Root>`);
	}
	return ctx;
};

/**
 * omits checked/unchecked attributes for indeterminate checkboxes.
 *
 * @param state checkbox state
 * @returns `data-*` attributes for the checkbox's state
 */
export const getCheckboxAttributes = (state: CheckboxState): DataAttributes => {
	if (state.indeterminate) {
		return { ...dataAttributes({ indeterminate: true }), ...getNativeInputAttributes(state) };
	}
	return getCheckedInputAttributes(state);
};

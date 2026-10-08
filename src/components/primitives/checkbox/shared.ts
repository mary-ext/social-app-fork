import { createContext, useContext } from 'react';

import type { ChangeDetails } from '../change-details';
import { type CheckedState, checkedStateAttributes, type NativeInputState } from '../native-input';

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
 * @returns the checked-state attribute mapping
 */
export const getCheckboxStateAttributes = (state: CheckboxState) => ({
	checked: (checked: boolean): Record<string, string> =>
		state.indeterminate ? {} : checkedStateAttributes.checked(checked),
});

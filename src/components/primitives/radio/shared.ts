import { createContext, useContext } from 'react';

import type { ChangeDetails } from '../change-details';
import type { CheckedState, NativeInputState } from '../native-input';

export type ValueChangeDetails = ChangeDetails<'none'>;

export type GroupContextValue = {
	value: unknown;
	name: string;
	form: string | undefined;
	disabled: boolean;
	readOnly: boolean;
	required: boolean;
	/** increments on each selection attempt, including rejected changes. */
	revision: number;
	/**
	 * @param value requested value
	 * @param event event that caused the request
	 */
	setValue: (value: unknown, event: Event) => void;
};

export const GroupContext = createContext<GroupContextValue | null>(null);
GroupContext.displayName = 'RadioGroupContext';

/**
 * @returns the enclosing radio group's state
 * @throws if called outside `Group`
 */
export const useGroupContext = (): GroupContextValue => {
	const ctx = useContext(GroupContext);
	if (ctx === null) {
		throw new Error(`radios require <Radio.Group>`);
	}
	return ctx;
};

export type RadioState = CheckedState & NativeInputState;

export const RadioContext = createContext<RadioState | null>(null);
RadioContext.displayName = 'RadioContext';

/**
 * @returns the enclosing radio's state
 * @throws if called outside `Radio.Root`
 */
export const useRadioContext = (): RadioState => {
	const ctx = useContext(RadioContext);
	if (ctx === null) {
		throw new Error(`radio parts require <Radio.Root>`);
	}
	return ctx;
};

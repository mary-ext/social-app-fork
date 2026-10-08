import { createContext, useContext } from 'react';

import type { ChangeDetails } from '../change-details';
import type { CheckedState, NativeInputState } from '../native-input';

export type CheckedChangeDetails = ChangeDetails<'none'>;

export type SwitchState = CheckedState & NativeInputState;

export const SwitchContext = createContext<SwitchState | null>(null);
SwitchContext.displayName = 'SwitchContext';

/**
 * @returns the enclosing switch's state
 * @throws if called outside `Switch.Root`
 */
export const useSwitchContext = (): SwitchState => {
	const ctx = useContext(SwitchContext);
	if (ctx === null) {
		throw new Error(`switch parts require <Switch.Root>`);
	}
	return ctx;
};

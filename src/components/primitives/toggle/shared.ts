import { createContext } from 'react';

import type { ChangeDetails } from '../change-details';
import type { Orientation } from '../composite';

export type { Orientation };

/** passed to `onPressedChange`, then `onValueChange`; canceling skips remaining callbacks and updates. */
export type PressedChangeDetails = ChangeDetails<'none'>;

export type GroupContextValue = {
	value: readonly string[];
	disabled: boolean;
	/**
	 * @param value the toggle's value
	 * @param pressed requested pressed state
	 * @param details shared change details
	 */
	setGroupValue: (value: string, pressed: boolean, details: PressedChangeDetails) => void;
};

export const GroupContext = createContext<GroupContextValue | null>(null);
GroupContext.displayName = 'ToggleGroupContext';

import { createContext, type RefObject, useContext } from 'react';

import type { ChangeDetails } from '../change-details';

export type VisibleChangeReason = 'form-reset' | 'form-submit' | 'toggle-press';

export type VisibleChangeDetails = ChangeDetails<VisibleChangeReason>;

export type RootContextValue = {
	visible: boolean;
	disabled: boolean;
	inputId: string;
	inputRef: RefObject<HTMLInputElement | null>;
	/**
	 * @param visible requested visibility
	 * @param reason what caused the request
	 * @param event event that caused the request
	 * @returns whether the request was accepted
	 */
	setVisible: (visible: boolean, reason: VisibleChangeReason, event: Event) => boolean;
};

export const RootContext = createContext<RootContextValue | null>(null);
RootContext.displayName = 'PasswordInputRootContext';

/**
 * @returns the enclosing password input's state
 * @throws if called outside `Root`
 */
export const useRootContext = (): RootContextValue => {
	const ctx = useContext(RootContext);
	if (ctx === null) {
		throw new Error(`password input parts require <PasswordInput.Root>`);
	}
	return ctx;
};

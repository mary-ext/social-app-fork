import { createContext, type RefObject, useContext } from 'react';

import type { ChangeDetails } from '../change-details';
import { HandleStore } from '../handle-store';

export type OpenChangeReason =
	| 'escape-key'
	| 'focus-out'
	| 'imperative-action'
	| 'item-press'
	| 'list-navigation'
	| 'outside-press'
	| 'trigger-press';

export type OpenChangeDetails = ChangeDetails<OpenChangeReason>;

export type OpenEntry = 'first' | 'last';

export type OpenChangeRequest = {
	reason: OpenChangeReason;
	event: Event;
	/** id of the trigger to anchor to; keeps the current one when omitted. */
	triggerId?: string;
	/** item to focus on open; omitted to focus the menu. */
	entry?: OpenEntry;
};

export type RootContextValue = {
	open: boolean;
	mounted: boolean;
	openEntry: OpenEntry | null;
	anchorName: string;
	popupId: string;
	activeTriggerId: string | null;
	activeTrigger: HTMLElement | null;
	positionerRef: RefObject<HTMLDialogElement | null>;
	/**
	 * @param open requested open state
	 * @param request reason and interaction details
	 * @returns whether the change was accepted
	 */
	setOpen: (open: boolean, request: OpenChangeRequest) => boolean;
	/**
	 * @param id trigger id
	 * @param trigger anchor element
	 * @returns a cleanup that unregisters the trigger
	 */
	registerTrigger: (id: string, trigger: HTMLElement) => () => void;
	onTransitionSettled: (open: boolean) => void;
};

export const RootContext = createContext<RootContextValue | null>(null);
RootContext.displayName = 'MenuRootContext';

/**
 * @returns the enclosing menu's state
 * @throws if called outside `Root`
 */
export const useRootContext = (): RootContextValue => {
	const ctx = useContext(RootContext);
	if (ctx === null) {
		throw new Error(`menu parts require <Menu.Root>`);
	}
	return ctx;
};

// #region handle

const handles = new HandleStore<RootContextValue>();

/** connects detached triggers to a `Root` and provides imperative control. */
export class Handle {
	/** whether the menu is open; `false` while no root is attached. */
	get isOpen(): boolean {
		return handles.get(this)?.open ?? false;
	}

	/**
	 * opens the menu anchored to a trigger; ignored while no root is attached.
	 *
	 * @param triggerId `id` of a `Trigger` sharing this handle
	 */
	open(triggerId: string): void {
		handles.get(this)?.setOpen(true, { reason: 'imperative-action', event: new Event('open'), triggerId });
	}

	/** closes the menu; ignored while no root is attached. */
	close(): void {
		handles.get(this)?.setOpen(false, { reason: 'imperative-action', event: new Event('close') });
	}
}

/** @returns a handle to pass to a `Root` and its detached triggers */
export const createHandle = (): Handle => {
	return new Handle();
};

/**
 * attaches a handle for this root's lifetime.
 *
 * @param handle handle passed to the root, if any
 * @param root the root's state
 */
export const useAttachRoot = (handle: Handle | undefined, root: RootContextValue): void => {
	handles.useAttach(handle, root);
};

/**
 * @param handle handle of a detached root; the enclosing root is used otherwise
 * @returns the menu's state, or `null` while a detached root is unmounted
 * @throws if neither a handle nor an enclosing `Root` is present
 */
export const useTriggerRootContext = (handle: Handle | undefined): RootContextValue | null => {
	return handles.useRootOrEnclosing(
		handle,
		useContext(RootContext),
		`<Menu.Trigger> requires <Menu.Root> or a handle`,
	);
};

// #endregion

// #region items

export const CheckedContext = createContext<boolean | null>(null);
CheckedContext.displayName = 'MenuCheckedContext';

/**
 * @returns whether the enclosing checkbox item is checked
 * @throws if called outside `CheckboxItem`
 */
export const useChecked = (): boolean => {
	const checked = useContext(CheckedContext);
	if (checked === null) {
		throw new Error(`<Menu.CheckboxItemIndicator> requires <Menu.CheckboxItem>`);
	}
	return checked;
};

export type GroupContextValue = {
	labelId: string;
	/** @returns a cleanup that unregisters the group's label */
	registerLabel: () => () => void;
};

export const GroupContext = createContext<GroupContextValue | null>(null);
GroupContext.displayName = 'MenuGroupContext';

/**
 * @returns the enclosing group's label state
 * @throws if called outside `Group`
 */
export const useGroupContext = (): GroupContextValue => {
	const ctx = useContext(GroupContext);
	if (ctx === null) {
		throw new Error(`<Menu.GroupLabel> requires <Menu.Group>`);
	}
	return ctx;
};

// #endregion

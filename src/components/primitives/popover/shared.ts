import { createContext, type RefObject, useContext } from 'react';

import type { InteractionType } from '#/lib/browser/input-modality';
import type { Timeout } from '#/lib/hooks/use-timeout';

import type { ChangeDetails } from '../change-details';
import { HandleStore } from '../handle-store';

export type OpenChangeReason =
	| 'close-press'
	| 'escape-key'
	| 'focus-out'
	| 'imperative-action'
	| 'outside-press'
	| 'trigger-hover'
	| 'trigger-press';

export type OpenChangeDetails = ChangeDetails<OpenChangeReason>;

export type OpenChangeRequest = {
	reason: OpenChangeReason;
	event: Event;
	/** trigger to anchor to; keeps the current one when omitted. */
	trigger?: HTMLElement;
	/** overrides the interaction type derived from `event`. */
	method?: InteractionType;
	/** for hover opens, the delay before a hover-driven close. */
	hoverCloseDelay?: number;
};

export type RootContextValue = {
	open: boolean;
	mounted: boolean;
	/** effective modality for the current open reason. */
	modal: boolean;
	openReason: OpenChangeReason | null;
	openMethod: InteractionType;
	anchorName: string;
	popupId: string;
	activeTrigger: HTMLElement | null;
	positionerRef: RefObject<HTMLDialogElement | null>;
	popupRef: RefObject<HTMLDivElement | null>;
	closeMethodRef: RefObject<InteractionType>;
	/** records React-tree membership, including events from nested portals. */
	markInside: (event: Event) => void;
	/** shared hover timer; opening and closing cancel each other's pending work. */
	timeout: Timeout;
	/**
	 * @param open requested open state
	 * @param request reason and interaction details
	 * @returns whether the change was accepted
	 */
	setOpen: (open: boolean, request: OpenChangeRequest) => boolean;
	startHoverClose: (event: Event) => void;
	/** claims the anchor if unclaimed; returns a cleanup. */
	claimTrigger: (trigger: HTMLElement) => () => void;
	onTransitionSettled: (open: boolean) => void;
};

export const RootContext = createContext<RootContextValue | null>(null);
RootContext.displayName = 'PopoverRootContext';

/**
 * @returns the enclosing popover's state
 * @throws if called outside `Root`
 */
export const useRootContext = (): RootContextValue => {
	const ctx = useContext(RootContext);
	if (ctx === null) {
		throw new Error(`popover parts require <Popover.Root>`);
	}
	return ctx;
};

const handles = new HandleStore<RootContextValue>();

/** connects detached triggers to a `Root` and provides imperative control. */
export class Handle {
	/** whether the popover is open; `false` while no root is attached. */
	get isOpen(): boolean {
		return handles.get(this)?.open ?? false;
	}

	/** closes the popover; ignored while no root is attached. */
	close(): void {
		handles.get(this)?.setOpen(false, { reason: 'imperative-action', event: new Event('close') });
	}
}

/** @returns a handle to pass to a `Root` and its detached triggers */
export const createHandle = (): Handle => {
	return new Handle();
};

/**
 * connects a handle to a root's state.
 *
 * @param handle handle passed to the root
 * @param root the root's state, or `null` once it unmounts
 */
export const attachRoot = (handle: Handle, root: RootContextValue | null): void => {
	const prev = handles.get(handle);
	// every other field is stable for the lifetime of a root.
	if (
		prev !== null &&
		root !== null &&
		prev.open === root.open &&
		prev.mounted === root.mounted &&
		prev.modal === root.modal &&
		prev.openReason === root.openReason &&
		prev.openMethod === root.openMethod &&
		prev.activeTrigger === root.activeTrigger
	) {
		return;
	}
	handles.attach(handle, root);
};

/**
 * @param handle handle of a detached root; the enclosing root is used otherwise
 * @returns the popover's state, or `null` while a detached root is unmounted
 * @throws if neither a handle nor an enclosing `Root` is present
 */
export const useTriggerRootContext = (handle: Handle | undefined): RootContextValue | null => {
	const enclosing = useContext(RootContext);
	const attached = handles.useRoot(handle);

	if (handle) {
		return attached;
	}
	if (enclosing === null) {
		throw new Error(`<Popover.Trigger> requires <Popover.Root> or a handle`);
	}
	return enclosing;
};

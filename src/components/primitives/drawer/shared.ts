import { createContext, type RefObject, useContext } from 'react';

import type { InteractionType } from '#/lib/browser/input-modality';

import { HandleStore } from '../handle-store';
import type { SwipeDirection } from '../swipe';

export type OpenChangeReason =
	| 'close-press'
	| 'escape-key'
	| 'imperative-action'
	| 'outside-press'
	| 'swipe'
	| 'trigger-press';

export type OpenChangeDetails = {
	reason: OpenChangeReason;
	event: Event;
	/** cancels this open/close request. */
	cancel(): void;
};

export type OpenChangeRequest = {
	reason: OpenChangeReason;
	event: Event;
	/** trigger to return focus to; keeps the current one when omitted. */
	trigger?: HTMLElement;
	/** overrides the interaction type derived from `event`. */
	method?: InteractionType;
};

export type RootContextValue = {
	open: boolean;
	mounted: boolean;
	swipeDirection: SwipeDirection;
	openMethod: InteractionType;
	activeTrigger: HTMLElement | null;
	popupId: string;
	titleId: string;
	descriptionId: string;
	/** whether `Title` and `Description` are mounted. */
	labels: { description: boolean; title: boolean };
	viewportRef: RefObject<HTMLDialogElement | null>;
	popupRef: RefObject<HTMLDivElement | null>;
	backdropRef: RefObject<HTMLDivElement | null>;
	closeMethodRef: RefObject<InteractionType>;
	/**
	 * @param open requested open state
	 * @param request reason and interaction details
	 * @returns whether the change was accepted
	 */
	setOpen: (open: boolean, request: OpenChangeRequest) => boolean;
	/** claims the trigger if unclaimed; returns a cleanup. */
	claimTrigger: (trigger: HTMLElement) => () => void;
	/** registers a rendered title or description; returns a cleanup. */
	registerLabel: (part: 'description' | 'title') => () => void;
	onTransitionSettled: (open: boolean) => void;
};

export const RootContext = createContext<RootContextValue | null>(null);
RootContext.displayName = 'DrawerRootContext';

/**
 * @returns the enclosing drawer's state
 * @throws if called outside `Root`
 */
export const useRootContext = (): RootContextValue => {
	const ctx = useContext(RootContext);
	if (ctx === null) {
		throw new Error(`drawer parts require <Drawer.Root>`);
	}
	return ctx;
};

const handles = new HandleStore<RootContextValue>();

/** connects detached triggers to a `Root` and provides imperative control. */
export class Handle {
	/** whether the drawer is open; `false` while no root is attached. */
	get isOpen(): boolean {
		return handles.get(this)?.open ?? false;
	}

	/** opens the drawer; ignored while no root is attached. */
	open(): void {
		handles.get(this)?.setOpen(true, { reason: 'imperative-action', event: new Event('open') });
	}

	/** closes the drawer; ignored while no root is attached. */
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
	// only open and activeTrigger affect detached triggers; handles use the stable setOpen callback.
	if (
		prev !== null &&
		root !== null &&
		prev.open === root.open &&
		prev.activeTrigger === root.activeTrigger
	) {
		return;
	}
	handles.attach(handle, root);
};

/**
 * @param handle handle of a detached root; the enclosing root is used otherwise
 * @returns the drawer's state, or `null` while a detached root is unmounted
 * @throws if neither a handle nor an enclosing `Root` is present
 */
export const useTriggerRootContext = (handle: Handle | undefined): RootContextValue | null => {
	const enclosing = useContext(RootContext);
	const attached = handles.useRoot(handle);

	if (handle) {
		return attached;
	}
	if (enclosing === null) {
		throw new Error(`<Drawer.Trigger> requires <Drawer.Root> or a handle`);
	}
	return enclosing;
};

export const CONTENT_ATTRIBUTE = 'data-drawer-content';

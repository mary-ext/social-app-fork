import { createContext, type RefObject, useContext } from 'react';

import type { InteractionType } from '#/lib/browser/input-modality';

import { HandleStore } from '../handle-store';

/** `escape-key` includes platform close requests, such as Android back. */
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
	/** whether a listener has canceled this request. */
	readonly isCanceled: boolean;
};

export type OpenChangeRequest = {
	reason: OpenChangeReason;
	event: Event;
	/** opening trigger and its id. */
	trigger?: { element: HTMLElement; id: string };
	/** payload exposed to the root's render function; replaces the previous one on open. */
	payload?: unknown;
	/** overrides the interaction type derived from `event`. */
	method?: InteractionType;
};

export type RootContextValue = {
	open: boolean;
	mounted: boolean;
	openMethod: InteractionType;
	activeTrigger: HTMLElement | null;
	activeTriggerId: string | null;
	popupId: string;
	titleId: string;
	descriptionId: string;
	/** whether `Title` and `Description` are mounted. */
	labels: { description: boolean; title: boolean };
	disablePointerDismissal: boolean;
	viewportRef: RefObject<HTMLDialogElement | null>;
	popupRef: RefObject<HTMLDivElement | null>;
	backdropRef: RefObject<HTMLDivElement | null>;
	closeMethodRef: RefObject<InteractionType>;
	/** focus-return candidates captured before opening. */
	returnFocusRef: RefObject<HTMLElement[]>;
	/**
	 * @param open requested open state
	 * @param request reason and interaction details
	 * @returns whether the change was accepted
	 */
	setOpen: (open: boolean, request: OpenChangeRequest) => boolean;
	/** registers a rendered title or description; returns a cleanup. */
	registerLabel: (part: 'description' | 'title') => () => void;
	onTransitionSettled: (open: boolean) => void;
};

export const RootContext = createContext<RootContextValue | null>(null);
RootContext.displayName = 'DialogRootContext';

/**
 * @returns the enclosing dialog's state
 * @throws if called outside `Root`
 */
export const useRootContext = (): RootContextValue => {
	const ctx = useContext(RootContext);
	if (ctx === null) {
		throw new Error(`dialog parts require <Dialog.Root>`);
	}
	return ctx;
};

const handles = new HandleStore<RootContextValue>();

/** controls a `Root` and connects detached triggers. methods have no effect without an attached root. */
// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- ties the payload type of a root to its triggers
export class Handle<Payload = void> {
	/** whether the dialog is open; `false` while no root is attached. */
	get isOpen(): boolean {
		return handles.get(this)?.open ?? false;
	}

	/** opens the dialog without a payload. */
	open(): void {
		handles.get(this)?.setOpen(true, { reason: 'imperative-action', event: new Event('open') });
	}

	/**
	 * opens the dialog with a payload.
	 *
	 * @param payload value exposed to the root's render function
	 */
	openWithPayload(payload: Payload): void {
		handles.get(this)?.setOpen(true, { reason: 'imperative-action', event: new Event('open'), payload });
	}

	/** closes the dialog. */
	close(): void {
		handles.get(this)?.setOpen(false, { reason: 'imperative-action', event: new Event('close') });
	}
}

/** @returns a handle to pass to a `Root` and its detached triggers */
export const createHandle = <Payload = void>(): Handle<Payload> => {
	return new Handle<Payload>();
};

/**
 * connects a handle to a root's state.
 *
 * @param handle handle passed to the root
 * @param root the root's state, or `null` once it unmounts
 */
export const attachRoot = (handle: Handle<unknown>, root: RootContextValue | null): void => {
	const prev = handles.get(handle);
	// only open and activeTriggerId affect detached triggers; handles use the stable setOpen callback.
	if (
		prev !== null &&
		root !== null &&
		prev.open === root.open &&
		prev.activeTriggerId === root.activeTriggerId
	) {
		return;
	}
	handles.attach(handle, root);
};

export type TriggerRoot = {
	/** whether a root is available; `false` while a detached root is unmounted. */
	attached: boolean;
	/** the popup's id while the dialog is open from this trigger, otherwise `null`. */
	controls: string | null;
	/** @returns the root's current state, for event handlers */
	getRoot: () => RootContextValue | null;
};

/**
 * subscribes to this trigger's attachment and open state.
 *
 * @param handle handle of a detached root; the enclosing root is used otherwise
 * @param triggerId id the trigger passes with its open requests
 * @returns the trigger's view of the root
 * @throws if neither a handle nor an enclosing `Root` is present
 */
export const useTriggerRoot = (handle: Handle<unknown> | undefined, triggerId: string): TriggerRoot => {
	const enclosing = useContext(RootContext);

	const selectControls = (root: RootContextValue | null): string | null => {
		return root?.open && root.activeTriggerId === triggerId ? root.popupId : null;
	};
	const attached = handles.useSelector(handle, (root) => root !== null);
	const attachedControls = handles.useSelector(handle, selectControls);

	if (handle) {
		return { attached, controls: attachedControls, getRoot: () => handles.get(handle) };
	}
	if (enclosing === null) {
		throw new Error(`<Dialog.Trigger> requires <Dialog.Root> or a handle`);
	}
	return { attached: true, controls: selectControls(enclosing), getRoot: () => enclosing };
};

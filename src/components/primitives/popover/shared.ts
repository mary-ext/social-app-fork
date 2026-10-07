import { createContext, type RefObject, useContext, useSyncExternalStore } from 'react';

import type { Timeout } from '@base-ui/utils/useTimeout';

import type { InputModality } from '#/lib/browser/input-modality';

/** the input that opened or closed the popover; empty when unknown. */
export type InteractionType = InputModality | '';

export type OpenChangeReason =
	| 'close-press'
	| 'escape-key'
	| 'focus-out'
	| 'imperative-action'
	| 'outside-press'
	| 'trigger-hover'
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
	modal: boolean;
	openReason: OpenChangeReason | null;
	openMethod: InteractionType;
	anchorName: string;
	popupId: string;
	activeTrigger: HTMLElement | null;
	positionerRef: RefObject<HTMLDivElement | null>;
	popupRef: RefObject<HTMLDivElement | null>;
	closeMethodRef: RefObject<InteractionType>;
	/** records React-tree membership, including events from nested portals. */
	markInside: (event: Event) => void;
	/** shared hover timer; opening and closing cancel each other's pending work. */
	timeout: Timeout;
	setOpen: (open: boolean, request: OpenChangeRequest) => void;
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

export const PortalContainerContext = createContext<RefObject<HTMLDivElement | null> | null>(null);
PortalContainerContext.displayName = 'PopoverPortalContainerContext';

/**
 * portal target for nested popups that would otherwise render beneath the top layer.
 *
 * @returns the enclosing popover's top-layer element, or `null` outside a popover
 */
export const usePortalContainer = (): RefObject<HTMLDivElement | null> | null => {
	return useContext(PortalContainerContext);
};

type HandleStore = {
	root: RootContextValue | null;
	listeners: Set<() => void>;
	subscribe: (listener: () => void) => () => void;
	getSnapshot: () => RootContextValue | null;
};

const handleStores = new WeakMap<Handle, HandleStore>();

const getHandleStore = (handle: Handle): HandleStore => {
	let store = handleStores.get(handle);
	if (store === undefined) {
		const created: HandleStore = {
			root: null,
			listeners: new Set(),
			subscribe(listener) {
				created.listeners.add(listener);
				return () => {
					created.listeners.delete(listener);
				};
			},
			getSnapshot() {
				return created.root;
			},
		};
		handleStores.set(handle, created);
		store = created;
	}
	return store;
};

/** connects detached triggers to a `Root` and provides imperative control. */
export class Handle {
	/** whether the popover is open; `false` while no root is attached. */
	get isOpen(): boolean {
		return getHandleStore(this).root?.open ?? false;
	}

	/** closes the popover; ignored while no root is attached. */
	close(): void {
		getHandleStore(this).root?.setOpen(false, { reason: 'imperative-action', event: new Event('close') });
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
	const store = getHandleStore(handle);
	const prev = store.root;
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

	store.root = root;
	for (const listener of store.listeners) {
		listener();
	}
};

const noopSubscribe = (): (() => void) => () => {};
const getNull = (): null => null;

/**
 * @param handle handle of a detached root; the enclosing root is used otherwise
 * @returns the popover's state, or `null` while a detached root is unmounted
 * @throws if neither a handle nor an enclosing `Root` is present
 */
export const useTriggerRootContext = (handle: Handle | undefined): RootContextValue | null => {
	const enclosing = useContext(RootContext);
	const store = handle ? getHandleStore(handle) : undefined;
	const attached = useSyncExternalStore(store?.subscribe ?? noopSubscribe, store?.getSnapshot ?? getNull);

	if (handle) {
		return attached;
	}
	if (enclosing === null) {
		throw new Error(`<Popover.Trigger> requires <Popover.Root> or a handle`);
	}
	return enclosing;
};

/**
 * @param pointerType a pointer event's `pointerType`
 * @returns the matching interaction type, or empty for unknown pointers
 */
export const toInteractionType = (pointerType: string): InteractionType => {
	switch (pointerType) {
		case 'mouse':
		case 'pen':
		case 'touch': {
			return pointerType;
		}
		default: {
			return '';
		}
	}
};

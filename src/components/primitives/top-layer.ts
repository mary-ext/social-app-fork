import {
	type DialogHTMLAttributes,
	type HTMLAttributes,
	type RefObject,
	useLayoutEffect,
	useRef,
} from 'react';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

// #region showing and hiding

// keep callbacks stable to avoid reattaching merged refs on each render.

const ignoreElement = (): void => {};

const showPopover = (el: HTMLElement | null, source: HTMLElement | undefined): void => {
	if (el && !el.matches(':popover-open')) {
		el.showPopover({ source });
	}
};

const showSourcelessPopover = (el: HTMLElement | null): void => {
	showPopover(el, undefined);
};

const sourcedPopoverShowers = new WeakMap<HTMLElement, (el: HTMLElement | null) => void>();

/**
 * shows an open popover in the top layer. leaves it shown on close for exit transitions before unmounting.
 *
 * @param open current open state
 * @param source invoking element for native Tab order; applied when shown
 * @returns a popover ref callback, stable for unchanged inputs
 */
export const showInTopLayer = (
	open: boolean,
	source?: HTMLElement | null,
): ((el: HTMLElement | null) => void) => {
	if (!open) {
		return ignoreElement;
	}
	if (!source) {
		return showSourcelessPopover;
	}

	let show = sourcedPopoverShowers.get(source);
	if (show === undefined) {
		show = (el) => showPopover(el, source);
		sourcedPopoverShowers.set(source, show);
	}
	return show;
};

const showModal = (el: HTMLDialogElement | null): void => {
	if (!el || el.open) {
		return;
	}
	// reopening during an exit transition.
	if (el.matches(':popover-open')) {
		el.hidePopover();
	}
	el.showModal();
};

/**
 * shows an open popup as a modal dialog. pair with {@link getDialogProps}.
 *
 * @param open current open state
 * @returns a dialog ref callback, stable for unchanged `open`
 */
export const showModalInTopLayer = (open: boolean): ((el: HTMLDialogElement | null) => void) => {
	return open ? showModal : ignoreElement;
};

/**
 * ends modality and keeps the popup in the top layer for exit transitions. call in a close layout effect
 * before restoring focus; closing the dialog may restore pre-open focus natively. requires an explicit CSS
 * `display` to preserve exit transitions between `close()` and `showPopover()`.
 *
 * @param el popup positioning dialog, or `null`
 * @returns whether focus was in the popup or on the body before closing
 */
export const leaveModal = (el: HTMLDialogElement | null): boolean => {
	const active = document.activeElement;
	const focused = active === document.body || !!el?.contains(active);
	if (el?.open) {
		el.close();
		el.showPopover();
	}
	return focused;
};

/**
 * routes native dialog dismissal through the popup's close handler.
 *
 * @param open current open state
 * @param requestClose receives the native event; returns whether dismissal was accepted
 * @returns props for the dialog element
 */
export const getDialogProps = (
	open: boolean,
	requestClose: (event: Event) => boolean,
): Pick<DialogHTMLAttributes<HTMLDialogElement>, 'onCancel' | 'onClose' | 'popover' | 'role'> => {
	return {
		popover: 'manual',
		role: 'presentation',
		onCancel(event) {
			event.preventDefault();
			requestClose(event.nativeEvent);
		},
		onClose(event) {
			const el = event.currentTarget;
			if (!open || el.open || el.matches(':popover-open')) {
				return;
			}
			// without intervening user activation, close requests can skip `cancel`; reopen if rejected.
			if (!requestClose(event.nativeEvent)) {
				el.showModal();
			}
		},
	};
};

/**
 * configures a hint popover: replaces other hints, leaves auto popovers open.
 *
 * @param requestClose receives the native event when the browser closes the hint
 * @returns props for the popover element
 */
export const getHintProps = (
	requestClose: (event: Event) => void,
): Pick<HTMLAttributes<HTMLElement>, 'onToggle' | 'popover'> => {
	return {
		// browsers without hint support treat it as manual.
		popover: 'hint',
		onToggle(event) {
			if (event.newState === 'closed') {
				requestClose(event.nativeEvent);
			}
		},
	};
};

// #endregion

// #region modal surfaces

// content outside a modal is inert even when painted above it; toasts must move inside.

const surfaces: HTMLElement[] = [];
const supportsMoveBefore = 'moveBefore' in Element.prototype;
const emitter = new SimpleEventEmitter<[]>();

const pushModalSurface = (surface: HTMLElement): (() => void) => {
	surfaces.push(surface);
	emitter.emit();
	return () => {
		const index = surfaces.lastIndexOf(surface);
		if (index === -1) {
			return;
		}
		surfaces.splice(index, 1);
		// removing a lower surface leaves the topmost one in place.
		if (index === surfaces.length) {
			emitter.emit();
		}
	};
};

/**
 * registers an open modal as a toast host. call from an ancestor of the part that ends modality, so toasts
 * move out only after modality ends.
 *
 * @param ref untransformed modal element
 * @param open current open state
 */
export const useModalSurface = (ref: RefObject<HTMLElement | null>, open: boolean): void => {
	const releaseRef = useRef<(() => void) | null>(null);

	useLayoutEffect(() => {
		if (open && ref.current) {
			releaseRef.current ??= pushModalSurface(ref.current);
		} else {
			releaseRef.current?.();
			releaseRef.current = null;
		}
	}, [open, ref]);

	useLayoutEffect(() => {
		return () => {
			releaseRef.current?.();
			releaseRef.current = null;
		};
	}, []);
};

/** @returns the topmost registered modal surface, or `null` if none is open */
export const getTopModalSurface = (): HTMLElement | null => {
	return surfaces.at(-1) ?? null;
};

/**
 * @param listener called when the topmost modal surface may have changed
 * @returns a function that unsubscribes
 */
export const subscribeModalSurfaces = (listener: () => void): (() => void) => {
	return emitter.subscribe(listener);
};

/**
 * reparents an element without resetting animation progress.
 *
 * @param parent new parent
 * @param node node to move
 */
export const moveKeepingAnimations = (parent: Element, node: Element): void => {
	if (supportsMoveBefore) {
		parent.moveBefore(node, null);
		return;
	}

	// insertBefore restarts CSS animations; restore their times after the move.
	const saved = node.getAnimations({ subtree: true }).map((animation) => ({
		target: animation.effect instanceof KeyframeEffect ? animation.effect.target : null,
		key: getAnimationKey(animation),
		currentTime: animation.currentTime,
	}));

	parent.insertBefore(node, null);

	for (const animation of node.getAnimations({ subtree: true })) {
		const target = animation.effect instanceof KeyframeEffect ? animation.effect.target : null;
		const key = getAnimationKey(animation);
		const match = saved.find((entry) => entry.target === target && entry.key === key);
		if (match) {
			animation.currentTime = match.currentTime;
		}
	}
};

const getAnimationKey = (animation: Animation): string | null => {
	if (animation instanceof CSSAnimation) {
		return `animation:${animation.animationName}`;
	}
	if (animation instanceof CSSTransition) {
		return `transition:${animation.transitionProperty}`;
	}
	return null;
};

// #endregion

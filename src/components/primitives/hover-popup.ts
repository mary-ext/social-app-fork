import { type FocusEvent as ReactFocusEvent, type RefObject, useEffect, useRef } from 'react';

import { useControlled } from '#/lib/hooks/use-controlled';
import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';
import { type Timeout, useTimeout } from '#/lib/hooks/use-timeout';

import { type ChangeDetails, createChangeDetails } from './change-details';
import { usePresence } from './presence';
import { isUnclaimedEscape } from './top-layer';

export type HoverDismissReason = 'escape-key' | 'focus-out' | 'outside-press';

export type HoverPopupRootOptions<Reason extends string> = {
	open: boolean | undefined;
	defaultOpen: boolean;
	/** prevents opening and hides an open popup. */
	disabled: boolean;
	onOpenChange: ((open: boolean, details: ChangeDetails<Reason | HoverDismissReason>) => void) | undefined;
	onOpenChangeComplete: ((open: boolean) => void) | undefined;
};

export type HoverPopupState<Reason extends string> = {
	open: boolean;
	mounted: boolean;
	/** blocks focus reopening after dismissal until the pointer or focus leaves the trigger. */
	blockedRef: RefObject<boolean>;
	/** reason for the latest accepted open. */
	openReasonRef: RefObject<Reason | HoverDismissReason | null>;
	triggerRef: RefObject<HTMLElement | null>;
	positionerRef: RefObject<HTMLDivElement | null>;
	/** one timer for pending opens and closes. */
	timeout: Timeout;
	setOpen: (open: boolean, reason: Reason | HoverDismissReason, event: Event) => void;
	onTransitionSettled: (open: boolean) => void;
};

/**
 * manages hover-popup state and dismissal on Escape, outside presses, or focus leaving.
 *
 * @param options open state and callbacks
 * @returns state, refs, and a timer shared by the popup parts
 */
export const useHoverPopupRoot = <Reason extends string>({
	open: openProp,
	defaultOpen,
	disabled,
	onOpenChange,
	onOpenChangeComplete,
}: HoverPopupRootOptions<Reason>): HoverPopupState<Reason> => {
	const [openState, setOpenState] = useControlled({ controlled: openProp, default: defaultOpen });
	const open = !disabled && openState;

	const { mounted, onTransitionSettled } = usePresence(open, onOpenChangeComplete);

	const blockedRef = useRef(false);
	const openReasonRef = useRef<Reason | HoverDismissReason | null>(null);
	const triggerRef = useRef<HTMLElement | null>(null);
	const positionerRef = useRef<HTMLDivElement | null>(null);
	const timeout = useTimeout();

	const setOpen = useNonReactiveCallback(
		(next: boolean, reason: Reason | HoverDismissReason, event: Event) => {
			timeout.clear();
			if (next === open) {
				return;
			}

			const details = createChangeDetails(reason, event);
			onOpenChange?.(next, details);
			if (details.isCanceled) {
				return;
			}
			if (next) {
				openReasonRef.current = reason;
			}
			setOpenState(next);
		},
	);

	useEffect(() => {
		if (!open) {
			return;
		}

		const isInside = (target: EventTarget | null) => {
			return (
				target instanceof Node &&
				(!!triggerRef.current?.contains(target) || !!positionerRef.current?.contains(target))
			);
		};

		const onKeyDown = (event: KeyboardEvent) => {
			if (!isUnclaimedEscape(event)) {
				return;
			}
			// keep Escape from closing an enclosing popup too.
			event.preventDefault();
			blockedRef.current = true;
			setOpen(false, 'escape-key', event);
		};
		const onPointerDown = (event: PointerEvent) => {
			if (!isInside(event.target)) {
				setOpen(false, 'outside-press', event);
			}
		};
		const onFocusIn = (event: FocusEvent) => {
			if (!isInside(event.target)) {
				setOpen(false, 'focus-out', event);
			}
		};

		const controller = new AbortController();
		const { signal } = controller;
		document.addEventListener('keydown', onKeyDown, { signal });
		document.addEventListener('pointerdown', onPointerDown, { capture: true, signal });
		document.addEventListener('focusin', onFocusIn, { signal });
		return () => controller.abort();
	}, [open, setOpen]);

	return {
		open,
		mounted,
		blockedRef,
		openReasonRef,
		triggerRef,
		positionerRef,
		timeout,
		setOpen,
		onTransitionSettled,
	};
};

/**
 * @param event the trigger's blur event
 * @param positioner the popup's positioning element
 * @returns whether focus left both trigger and popup; ignores window blur
 */
export const isFocusLeaving = (
	event: ReactFocusEvent<HTMLElement>,
	positioner: HTMLElement | null,
): boolean => {
	const next = event.relatedTarget;
	const trigger = event.currentTarget;
	if (next === null) {
		return document.activeElement !== trigger;
	}
	return !trigger.contains(next) && !positioner?.contains(next);
};

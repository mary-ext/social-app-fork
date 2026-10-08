'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type ReactNode, type RefObject, useEffect, useId, useRef, useState } from 'react';

import { getInteractionType, type InteractionType } from '#/lib/browser/input-modality';
import { useControlled } from '#/lib/hooks/use-controlled';
import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';
import { useScrollLock } from '#/lib/hooks/use-scroll-lock';
import { useTimeout } from '#/lib/hooks/use-timeout';

import { HOVERABLE_GRACE, isWithinPopup } from '../anchored-popup';
import { createChangeDetails } from '../change-details';
import { usePresence } from '../presence';
import { isUnclaimedEscape } from '../top-layer';
import {
	type Handle,
	type OpenChangeDetails,
	type OpenChangeReason,
	type OpenChangeRequest,
	RootContext,
	type RootContextValue,
	useAttachRoot,
} from './shared';

const PATIENT_CLICK_THRESHOLD = 500;

export type RootProps = {
	children?: ReactNode;
	/** controlled open state. */
	open?: boolean;
	/** initial uncontrolled open state. */
	defaultOpen?: boolean;
	/** receives cancellable open/close requests. */
	onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
	/** receives the open state after animations finish. */
	onOpenChangeComplete?: (open: boolean) => void;
	/**
	 * makes outside content inert and locks scrolling; defaults to `true`. hover opens remain non-modal.
	 * include a `Close` for touch screen reader users.
	 */
	modal?: boolean;
	/** handle shared with detached triggers. */
	handle?: Handle;
};

/**
 * shares state across the popover parts.
 *
 * @param props popover parts, open state, and callbacks
 * @returns the popover parts without a wrapper element
 */
export const Root = ({
	children,
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	onOpenChangeComplete,
	modal: modalProp = true,
	handle,
}: RootProps) => {
	const [open, setOpenState] = useControlled({
		controlled: openProp,
		default: defaultOpen,
	});

	const { mounted, onTransitionSettled } = usePresence(open, onOpenChangeComplete);

	const [openReason, setOpenReason] = useState<OpenChangeReason | null>(null);
	const [openMethod, setOpenMethod] = useState<InteractionType>('');
	const [activeTrigger, setActiveTrigger] = useState<HTMLElement | null>(null);
	const modal = modalProp && openReason !== 'trigger-hover';

	const id = useId();
	const anchorName = `--popover-${CSS.escape(id)}`;
	const popupId = `${id}popup`;

	const positionerRef = useRef<HTMLDialogElement | null>(null);
	const popupRef = useRef<HTMLDivElement | null>(null);
	const closeMethodRef = useRef<InteractionType>('');
	const hoverCloseDelayRef = useRef(0);
	const insideEventRef = useRef<Event | null>(null);
	const stickUntilRef = useRef(0);
	const timeout = useTimeout();

	const setOpen = useNonReactiveCallback((next: boolean, request: OpenChangeRequest) => {
		timeout.clear();
		if (next === open) {
			return false;
		}
		// ignore trigger clicks immediately after hover opening.
		if (!next && request.reason === 'trigger-press' && performance.now() < stickUntilRef.current) {
			return false;
		}

		const details = createChangeDetails(request.reason, request.event);
		onOpenChange?.(next, details);
		if (details.isCanceled) {
			return false;
		}

		const method = request.method ?? getInteractionType(request.event);
		if (next) {
			setOpenReason(request.reason);
			setOpenMethod(method);
			if (request.trigger) {
				setActiveTrigger(request.trigger);
			}
			stickUntilRef.current =
				request.reason === 'trigger-hover' ? performance.now() + PATIENT_CLICK_THRESHOLD : 0;
			hoverCloseDelayRef.current = request.hoverCloseDelay ?? 0;
		} else {
			closeMethodRef.current = method;
		}
		setOpenState(next);
		return true;
	});

	const claimTrigger = useNonReactiveCallback((trigger: HTMLElement) => {
		setActiveTrigger((prev) => prev ?? trigger);
		return () => {
			setActiveTrigger((prev) => (prev === trigger ? null : prev));
		};
	});

	const markInside = useNonReactiveCallback((event: Event) => {
		insideEventRef.current = event;
	});

	const startHoverClose = useNonReactiveCallback((event: Event) => {
		timeout.start(Math.max(hoverCloseDelayRef.current, HOVERABLE_GRACE), () =>
			setOpen(false, { reason: 'trigger-hover', event }),
		);
	});

	useEffect(() => {
		if (!open) {
			return;
		}

		const parts = { activeTrigger, insideEventRef, positionerRef };

		const onKeyDown = (event: KeyboardEvent) => {
			if (!isUnclaimedEscape(event)) {
				return;
			}
			// Escape inside a nested portal should not dismiss the outer popover.
			const target = event.target;
			if (
				insideEventRef.current === event &&
				target instanceof Node &&
				!positionerRef.current?.contains(target)
			) {
				return;
			}
			// avoid a second close request from the native dialog.
			event.preventDefault();
			setOpen(false, { reason: 'escape-key', event });
		};

		// wait for a complete outside click to avoid dismissing on drags; touch dismisses on contact.
		let pressedOutside = false;
		const onPointerDown = (event: PointerEvent) => {
			pressedOutside = !isInsideEvent(event, parts);
			if (pressedOutside && event.pointerType === 'touch') {
				pressedOutside = false;
				setOpen(false, { reason: 'outside-press', event });
			}
		};
		const onClick = (event: MouseEvent) => {
			if (pressedOutside && !isInsideEvent(event, parts)) {
				setOpen(false, { reason: 'outside-press', event });
			}
			pressedOutside = false;
		};

		const onFocusIn = (event: FocusEvent) => {
			if (!isInsideEvent(event, parts)) {
				setOpen(false, { reason: 'focus-out', event });
			}
		};

		const controller = new AbortController();
		const { signal } = controller;
		document.addEventListener('keydown', onKeyDown, { signal });
		document.addEventListener('pointerdown', onPointerDown, { signal });
		document.addEventListener('click', onClick, { signal });
		if (!modal) {
			document.addEventListener('focusin', onFocusIn, { signal });
		}
		return () => controller.abort();
	}, [open, modal, activeTrigger, setOpen]);

	useScrollLock(open && modal);

	const value: RootContextValue = {
		open,
		mounted,
		modal,
		openReason,
		openMethod,
		anchorName,
		popupId,
		activeTrigger,
		positionerRef,
		popupRef,
		closeMethodRef,
		markInside,
		timeout,
		setOpen,
		startHoverClose,
		claimTrigger,
		onTransitionSettled,
	};

	useAttachRoot(handle, value);

	return <RootContext.Provider value={value}>{children}</RootContext.Provider>;
};

const isInsideEvent = (
	event: Event,
	ctx: {
		activeTrigger: HTMLElement | null;
		insideEventRef: RefObject<Event | null>;
		positionerRef: RefObject<HTMLDialogElement | null>;
	},
): boolean => {
	const target = event.target;
	if (!(target instanceof Node)) {
		return false;
	}
	return (
		ctx.insideEventRef.current === event ||
		!!ctx.activeTrigger?.contains(target) ||
		isWithinPopup(ctx.positionerRef.current, target)
	);
};

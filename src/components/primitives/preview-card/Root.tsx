'use no memo'; // preview card parts skip React Compiler caching; composition props usually invalidate it

import { type ReactNode, useEffect, useId, useRef } from 'react';

import { useControlled } from '#/lib/hooks/use-controlled';
import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';
import { useTimeout } from '#/lib/hooks/use-timeout';

import { HOVERABLE_GRACE } from '../anchored-popup';
import { usePresence } from '../presence';
import { type OpenChangeDetails, type OpenChangeReason, RootContext, type RootContextValue } from './shared';

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
};

/**
 * shares state across the preview card parts.
 *
 * @param props preview card parts, open state, and callbacks
 * @returns the preview card parts without a wrapper element
 */
export const Root = ({
	children,
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	onOpenChangeComplete,
}: RootProps) => {
	const [open, setOpenState] = useControlled({
		controlled: openProp,
		default: defaultOpen,
	});

	const { mounted, onTransitionSettled } = usePresence(open, onOpenChangeComplete);

	const anchorName = `--preview-card-${CSS.escape(useId())}`;
	const blockedRef = useRef(false);
	const openReasonRef = useRef<OpenChangeReason | null>(null);
	const closeDelayRef = useRef(0);
	const triggerRef = useRef<HTMLElement | null>(null);
	const positionerRef = useRef<HTMLDivElement | null>(null);
	const timeout = useTimeout();

	const setOpen = useNonReactiveCallback((next: boolean, reason: OpenChangeReason, event: Event) => {
		timeout.clear();
		if (next === open) {
			return;
		}

		let canceled = false;
		onOpenChange?.(next, {
			reason,
			event,
			cancel() {
				canceled = true;
			},
		});

		if (!canceled) {
			if (next) {
				openReasonRef.current = reason;
			}
			setOpenState(next);
		}
	});

	const startHoverClose = useNonReactiveCallback((event: Event) => {
		if (openReasonRef.current !== 'trigger-hover') {
			return;
		}
		timeout.start(Math.max(closeDelayRef.current, HOVERABLE_GRACE), () =>
			setOpen(false, 'trigger-hover', event),
		);
	});

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
			if (event.key !== 'Escape' || event.isComposing || event.defaultPrevented) {
				return;
			}
			// keep enclosing dialogs and popovers open.
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

	const value: RootContextValue = {
		open,
		mounted,
		anchorName,
		blockedRef,
		closeDelayRef,
		triggerRef,
		positionerRef,
		setOpen,
		startHoverClose,
		timeout,
		onTransitionSettled,
	};

	return <RootContext.Provider value={value}>{children}</RootContext.Provider>;
};

'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type ReactNode, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useConstant } from '#/lib/hooks/use-constant';
import { useControlled } from '#/lib/hooks/use-controlled';
import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';
import { useScrollLock } from '#/lib/hooks/use-scroll-lock';

import { isWithinPopup } from '../anchored-popup';
import { createChangeDetails } from '../change-details';
import { usePresence } from '../presence';
import {
	attachRoot,
	type Handle,
	type OpenChangeDetails,
	type OpenChangeRequest,
	type OpenEntry,
	RootContext,
	type RootContextValue,
} from './shared';

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
	/** handle shared with detached triggers. */
	handle?: Handle;
};

/**
 * manages modal menu state and locks scrolling while open.
 *
 * @param props menu parts, open state, and callbacks
 * @returns the menu parts without a wrapper element
 */
export const Root = ({
	children,
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	onOpenChangeComplete,
	handle,
}: RootProps) => {
	const [open, setOpenState] = useControlled({
		controlled: openProp,
		default: defaultOpen,
	});

	const { mounted, onTransitionSettled } = usePresence(open, onOpenChangeComplete);

	const [openEntry, setOpenEntry] = useState<OpenEntry | null>(null);
	const [requestedTriggerId, setRequestedTriggerId] = useState<string | null>(null);

	const id = useId();
	const anchorName = `--menu-${CSS.escape(id)}`;
	const popupId = `${id}popup`;

	const positionerRef = useRef<HTMLDialogElement | null>(null);
	// trigger registration need not rerender; anchors are read on open.
	const triggers = useConstant(() => new Map<string, HTMLElement>());

	// opens without a requested trigger use the first registered one.
	const activeTriggerId = requestedTriggerId ?? (mounted ? (triggers.keys().next().value ?? null) : null);
	const activeTrigger = activeTriggerId !== null ? (triggers.get(activeTriggerId) ?? null) : null;

	const setOpen = useNonReactiveCallback((next: boolean, request: OpenChangeRequest) => {
		if (next === open || (request.triggerId !== undefined && !triggers.has(request.triggerId))) {
			return false;
		}

		const details = createChangeDetails(request.reason, request.event);
		onOpenChange?.(next, details);
		if (details.isCanceled) {
			return false;
		}

		if (next) {
			setOpenEntry(request.entry ?? null);
			if (request.triggerId !== undefined) {
				setRequestedTriggerId(request.triggerId);
			}
		}
		setOpenState(next);
		return true;
	});

	const registerTrigger = useNonReactiveCallback((triggerId: string, trigger: HTMLElement) => {
		triggers.set(triggerId, trigger);
		return () => {
			if (triggers.get(triggerId) === trigger) {
				triggers.delete(triggerId);
			}
		};
	});

	useEffect(() => {
		if (!open) {
			return;
		}

		const isInside = (target: EventTarget | null) => {
			return (
				(target instanceof Node && !!activeTrigger?.contains(target)) ||
				isWithinPopup(positionerRef.current, target)
			);
		};

		// wait for click to ignore drags and keep outside content inert until the press ends.
		let pressedOutside = false;
		const onPointerDown = (event: PointerEvent) => {
			pressedOutside = !isInside(event.target);
		};
		const onClick = (event: MouseEvent) => {
			if (pressedOutside && !isInside(event.target)) {
				setOpen(false, { reason: 'outside-press', event });
			}
			pressedOutside = false;
		};

		const controller = new AbortController();
		const { signal } = controller;
		document.addEventListener('pointerdown', onPointerDown, { signal });
		document.addEventListener('click', onClick, { signal });
		return () => controller.abort();
	}, [open, activeTrigger, setOpen]);

	useScrollLock(open);

	const ctx = useMemo(
		(): RootContextValue => ({
			open,
			mounted,
			openEntry,
			anchorName,
			popupId,
			activeTriggerId,
			activeTrigger,
			positionerRef,
			setOpen,
			registerTrigger,
			onTransitionSettled,
		}),
		[
			open,
			mounted,
			openEntry,
			anchorName,
			popupId,
			activeTriggerId,
			activeTrigger,
			setOpen,
			registerTrigger,
			onTransitionSettled,
		],
	);

	useLayoutEffect(() => {
		if (handle) {
			attachRoot(handle, ctx);
		}
	}, [handle, ctx]);
	useLayoutEffect(() => {
		if (!handle) {
			return;
		}
		return () => {
			attachRoot(handle, null);
		};
	}, [handle]);

	return <RootContext.Provider value={ctx}>{children}</RootContext.Provider>;
};

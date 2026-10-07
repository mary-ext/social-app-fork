'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type ReactNode, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { useControlled } from '@base-ui/utils/useControlled';
import { useScrollLock } from '@base-ui/utils/useScrollLock';

import { useConstant } from '#/lib/hooks/use-constant';
import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

import { usePresence } from '../anchored-popup';
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
	/** makes outside content inert and locks scrolling while open; defaults to `true`. */
	modal?: boolean;
	/** handle shared with detached triggers. */
	handle?: Handle;
};

/**
 * manages menu state.
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
	modal = true,
	handle,
}: RootProps) => {
	const [open, setOpenState] = useControlled({
		controlled: openProp,
		default: defaultOpen,
		name: 'Menu',
		state: 'open',
	});

	const { mounted, onTransitionSettled } = usePresence(open, onOpenChangeComplete);

	const [openEntry, setOpenEntry] = useState<OpenEntry | null>(null);
	const [requestedTriggerId, setRequestedTriggerId] = useState<string | null>(null);

	const id = useId();
	const anchorName = `--menu-${CSS.escape(id)}`;
	const popupId = `${id}popup`;

	const positionerRef = useRef<HTMLDivElement | null>(null);
	// trigger registration need not rerender; anchors are read on open.
	const triggers = useConstant(() => new Map<string, HTMLElement>());

	// opens without a requested trigger use the first registered one.
	const activeTriggerId = requestedTriggerId ?? (mounted ? (triggers.keys().next().value ?? null) : null);
	const activeTrigger = activeTriggerId !== null ? (triggers.get(activeTriggerId) ?? null) : null;

	const setOpen = useNonReactiveCallback((next: boolean, request: OpenChangeRequest) => {
		if (next === open || (request.triggerId !== undefined && !triggers.has(request.triggerId))) {
			return;
		}

		let canceled = false;
		onOpenChange?.(next, {
			reason: request.reason,
			event: request.event,
			cancel() {
				canceled = true;
			},
		});
		if (canceled) {
			return;
		}

		if (next) {
			setOpenEntry(request.entry ?? null);
			if (request.triggerId !== undefined) {
				setRequestedTriggerId(request.triggerId);
			}
		}
		setOpenState(next);
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
				target instanceof Node &&
				(!!activeTrigger?.contains(target) || !!positionerRef.current?.contains(target))
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

		const onFocusIn = (event: FocusEvent) => {
			if (!isInside(event.target)) {
				setOpen(false, { reason: 'focus-out', event });
			}
		};

		return mergeCleanups(
			addEventListener(document, 'pointerdown', onPointerDown),
			addEventListener(document, 'click', onClick),
			modal ? undefined : addEventListener(document, 'focusin', onFocusIn),
		);
	}, [open, modal, activeTrigger, setOpen]);

	useScrollLock(open && modal, activeTrigger);

	const ctx = useMemo(
		(): RootContextValue => ({
			open,
			mounted,
			modal,
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
			modal,
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

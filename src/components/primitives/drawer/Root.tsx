'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type ReactNode, useCallback, useId, useLayoutEffect, useRef, useState } from 'react';

import { useControlled } from '@base-ui/utils/useControlled';
import { useScrollLock } from '@base-ui/utils/useScrollLock';

import { getInteractionType, type InteractionType } from '#/lib/browser/input-modality';
import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

import { usePresence } from '../presence';
import type { SwipeDirection } from '../swipe';
import {
	attachRoot,
	type Handle,
	type OpenChangeDetails,
	type OpenChangeRequest,
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
	/** direction the popup travels when swiped closed; defaults to `down`. */
	swipeDirection?: SwipeDirection;
	/** handle shared with detached triggers. */
	handle?: Handle;
};

/**
 * shares drawer state. while open, outside content is inert and page scrolling is locked.
 *
 * @param props drawer parts, open state, and callbacks
 * @returns the drawer parts without a wrapper element
 */
export const Root = ({
	children,
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	onOpenChangeComplete,
	swipeDirection = 'down',
	handle,
}: RootProps) => {
	const [open, setOpenState] = useControlled({
		controlled: openProp,
		default: defaultOpen,
		name: 'Drawer',
		state: 'open',
	});

	const { mounted, onTransitionSettled } = usePresence(open, onOpenChangeComplete);

	const [openMethod, setOpenMethod] = useState<InteractionType>('');
	const [activeTrigger, setActiveTrigger] = useState<HTMLElement | null>(null);
	const [labels, setLabels] = useState({ description: 0, title: 0 });

	const id = useId();
	const popupId = `${id}popup`;

	const viewportRef = useRef<HTMLDialogElement | null>(null);
	const popupRef = useRef<HTMLDivElement | null>(null);
	const backdropRef = useRef<HTMLDivElement | null>(null);
	const closeMethodRef = useRef<InteractionType>('');

	const setOpen = useNonReactiveCallback((next: boolean, request: OpenChangeRequest) => {
		if (next === open) {
			return false;
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
			return false;
		}

		const method = request.method ?? getInteractionType(request.event);
		if (next) {
			setOpenMethod(method);
			if (request.trigger) {
				setActiveTrigger(request.trigger);
			}
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

	const registerLabel = useCallback((part: 'description' | 'title') => {
		setLabels((prev) => ({ ...prev, [part]: prev[part] + 1 }));
		return () => {
			setLabels((prev) => ({ ...prev, [part]: prev[part] - 1 }));
		};
	}, []);

	useScrollLock(open, activeTrigger);

	const value: RootContextValue = {
		open,
		mounted,
		swipeDirection,
		openMethod,
		activeTrigger,
		popupId,
		titleId: `${id}title`,
		descriptionId: `${id}description`,
		labels: { description: labels.description > 0, title: labels.title > 0 },
		viewportRef,
		popupRef,
		backdropRef,
		closeMethodRef,
		setOpen,
		claimTrigger,
		registerLabel,
		onTransitionSettled,
	};

	useLayoutEffect(() => {
		if (handle) {
			attachRoot(handle, value);
		}
	});
	useLayoutEffect(() => {
		if (!handle) {
			return;
		}
		return () => {
			attachRoot(handle, null);
		};
	}, [handle]);

	return <RootContext.Provider value={value}>{children}</RootContext.Provider>;
};

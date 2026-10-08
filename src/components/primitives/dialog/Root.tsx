'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type ReactNode, useCallback, useId, useLayoutEffect, useRef, useState } from 'react';

import { getInteractionType, type InteractionType } from '#/lib/browser/input-modality';
import { useControlled } from '#/lib/hooks/use-controlled';
import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';
import { useScrollLock } from '#/lib/hooks/use-scroll-lock';

import { createChangeDetails } from '../change-details';
import { usePresence } from '../presence';
import {
	attachRoot,
	type Handle,
	type OpenChangeDetails,
	type OpenChangeRequest,
	RootContext,
	type RootContextValue,
} from './shared';

export type RootProps<Payload = void> = {
	/** dialog parts, or a function receiving the payload of the latest open request. */
	children?: ReactNode | ((bag: { payload: Payload | undefined }) => ReactNode);
	/** controlled open state. */
	open?: boolean;
	/** initial uncontrolled open state. */
	defaultOpen?: boolean;
	/** receives cancellable open/close requests. */
	onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
	/** receives the open state after animations finish. */
	onOpenChangeComplete?: (open: boolean) => void;
	/** prevents presses outside the popup from closing the dialog. */
	disablePointerDismissal?: boolean;
	/** handle shared with detached triggers. */
	handle?: Handle<Payload>;
};

/**
 * shares dialog state. while open, outside content is inert and page scrolling is locked.
 *
 * @param props dialog parts, open state, and callbacks
 * @returns the dialog parts without a wrapper element
 */
export const Root = <Payload = void,>({
	children,
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	onOpenChangeComplete,
	disablePointerDismissal = false,
	handle,
}: RootProps<Payload>) => {
	const [open, setOpenState] = useControlled({
		controlled: openProp,
		default: defaultOpen,
	});

	const { mounted, onTransitionSettled } = usePresence(open, onOpenChangeComplete);

	const [openMethod, setOpenMethod] = useState<InteractionType>('');
	const [activeTrigger, setActiveTrigger] = useState<OpenChangeRequest['trigger'] | null>(null);
	const [payload, setPayload] = useState<Payload | undefined>(undefined);
	const [labels, setLabels] = useState({ description: 0, title: 0 });

	const id = useId();
	const popupId = `${id}popup`;

	const viewportRef = useRef<HTMLDialogElement | null>(null);
	const popupRef = useRef<HTMLDivElement | null>(null);
	const backdropRef = useRef<HTMLDivElement | null>(null);
	const closeMethodRef = useRef<InteractionType>('');
	const returnFocusRef = useRef<HTMLElement[]>([]);

	const setOpen = useNonReactiveCallback((next: boolean, request: OpenChangeRequest) => {
		if (next === open) {
			return false;
		}

		const details = createChangeDetails(request.reason, request.event);
		onOpenChange?.(next, details);
		if (details.isCanceled) {
			return false;
		}

		const method = request.method ?? getInteractionType(request.event);
		if (next) {
			setOpenMethod(method);
			setActiveTrigger(request.trigger ?? null);
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- handles and triggers share the root's `Payload`
			setPayload(() => request.payload as Payload | undefined);
		} else {
			closeMethodRef.current = method;
		}
		setOpenState(next);
		return true;
	});

	const registerLabel = useCallback((part: 'description' | 'title') => {
		setLabels((prev) => ({ ...prev, [part]: prev[part] + 1 }));
		return () => {
			setLabels((prev) => ({ ...prev, [part]: prev[part] - 1 }));
		};
	}, []);

	useScrollLock(open);

	const value: RootContextValue = {
		open,
		mounted,
		openMethod,
		activeTrigger: activeTrigger?.element ?? null,
		activeTriggerId: activeTrigger?.id ?? null,
		popupId,
		titleId: `${id}title`,
		descriptionId: `${id}description`,
		labels: { description: labels.description > 0, title: labels.title > 0 },
		disablePointerDismissal,
		viewportRef,
		popupRef,
		backdropRef,
		closeMethodRef,
		returnFocusRef,
		setOpen,
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

	return (
		<RootContext.Provider value={value}>
			{typeof children === 'function' ? children({ payload }) : children}
		</RootContext.Provider>
	);
};

'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type ReactNode, useEffect, useId, useRef } from 'react';

import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { useControlled } from '@base-ui/utils/useControlled';
import { useTimeout } from '@base-ui/utils/useTimeout';

import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

import { usePresence } from '../anchored-popup';
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
	/** prevents opening and hides an open tooltip. */
	disabled?: boolean;
	/** closes on trigger leave, after `closeDelay`, even when the pointer enters the popup. */
	disableHoverablePopup?: boolean;
};

/**
 * shares state across the tooltip parts.
 *
 * @param props tooltip parts, open state, and callbacks
 * @returns the tooltip parts without a wrapper element
 */
export const Root = ({
	children,
	open: openProp,
	defaultOpen = false,
	onOpenChange,
	onOpenChangeComplete,
	disabled = false,
	disableHoverablePopup = false,
}: RootProps) => {
	const [openState, setOpenState] = useControlled({
		controlled: openProp,
		default: defaultOpen,
		name: 'Tooltip',
		state: 'open',
	});
	const open = !disabled && openState;

	const { mounted, onTransitionSettled } = usePresence(open, onOpenChangeComplete);

	const anchorName = `--tooltip-${CSS.escape(useId())}`;
	const blockedRef = useRef(false);
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
			setOpenState(next);
		}
	});

	useEffect(() => {
		if (!open) {
			return;
		}

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				blockedRef.current = true;
				setOpen(false, 'escape-key', event);
			}
		};
		const onPointerDown = (event: Event) => {
			const target = event.target;
			if (
				target instanceof Node &&
				!triggerRef.current?.contains(target) &&
				!positionerRef.current?.contains(target)
			) {
				setOpen(false, 'outside-press', event);
			}
		};

		return mergeCleanups(
			addEventListener(document, 'keydown', onKeyDown),
			addEventListener(document, 'pointerdown', onPointerDown, true),
		);
	}, [open, setOpen]);

	const value: RootContextValue = {
		open,
		mounted,
		disabled,
		disableHoverablePopup,
		anchorName,
		blockedRef,
		triggerRef,
		positionerRef,
		setOpen,
		timeout,
		onTransitionSettled,
	};

	return <RootContext.Provider value={value}>{children}</RootContext.Provider>;
};

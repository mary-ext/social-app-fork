'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';

import type { InteractionType } from '#/lib/browser/input-modality';
import { useConstant } from '#/lib/hooks/use-constant';
import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';
import { useScrollLock } from '#/lib/hooks/use-scroll-lock';

import { isWithinPopup } from '../anchored-popup';
import { createTypeahead } from '../list-navigation';
import { usePresence } from '../presence';
import {
	type OpenChangeReason,
	type OpenChangeRequest,
	type OpenEntry,
	RootContext,
	type RootContextValue,
	isEmptyValue,
	type SelectItem,
} from './shared';

export type RootProps<Value> = {
	children?: ReactNode;
	/** the selection; matched with `Object.is`. */
	value: Value;
	/** called when the user selects a different value. */
	onValueChange: (value: Value) => void;
	/** labels for `Value` and for typeahead on the closed trigger. */
	items?: readonly SelectItem<Value>[];
	/** prevents opening and changing the value. */
	disabled?: boolean;
};

/**
 * manages selection and modal listbox state. locks scrolling while open.
 *
 * @param props select parts, value, and change callback
 * @returns the select parts without a wrapper element
 */
export const Root = <Value,>({
	children,
	value,
	onValueChange,
	items,
	disabled = false,
}: RootProps<Value>) => {
	// oxlint-disable-next-line react/hook-use-state -- `setOpen` wraps the setter with the open request
	const [open, setOpenState] = useState(false);

	const [openMethod, setOpenMethod] = useState<InteractionType>('');
	const [openEntry, setOpenEntry] = useState<OpenEntry>();
	const closeReasonRef = useRef<OpenChangeReason | null>(null);

	const onSettled = useNonReactiveCallback((settledOpen: boolean) => {
		// outside presses on non-focusable content leave focus on the body.
		if (
			!settledOpen &&
			closeReasonRef.current === 'outside-press' &&
			document.activeElement === document.body
		) {
			triggerRef.current?.focus({ preventScroll: true });
		}
	});
	const { mounted, onTransitionSettled } = usePresence(open, onSettled);

	const id = useId();
	const anchorName = `--select-${CSS.escape(id)}`;

	const triggerRef = useRef<HTMLElement | null>(null);
	const positionerRef = useRef<HTMLDialogElement | null>(null);
	const popupRef = useRef<HTMLDivElement | null>(null);
	const typeahead = useConstant(createTypeahead);

	const setOpen = useNonReactiveCallback((next: boolean, request: OpenChangeRequest) => {
		if (next === open || (next && disabled)) {
			return false;
		}

		if (next) {
			setOpenMethod(request.method);
			setOpenEntry(request.entry);
		} else {
			closeReasonRef.current = request.reason;
		}
		setOpenState(next);
		return true;
	});

	const select = useNonReactiveCallback((next: unknown) => {
		if (disabled) {
			return;
		}
		if (!Object.is(next, value)) {
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- items carry `Root`'s `Value`; context erases it
			onValueChange(next as Value);
		}
		setOpen(false, { reason: 'item-press', method: '' });
	});

	useEffect(() => {
		if (!open) {
			return;
		}

		const onPointerDown = (event: PointerEvent) => {
			const target = event.target;
			const inside =
				(target instanceof Node && !!triggerRef.current?.contains(target)) ||
				isWithinPopup(positionerRef.current, target);
			if (!inside) {
				setOpen(false, { reason: 'outside-press', method: '' });
			}
		};

		const controller = new AbortController();
		document.addEventListener('pointerdown', onPointerDown, { signal: controller.signal });
		return () => controller.abort();
	}, [open, setOpen]);

	useScrollLock(open);

	const selectedItem = items?.find((item) => Object.is(item.value, value));
	// an explicit option, such as `null` for "none", takes precedence over the placeholder.
	const placeholder = !selectedItem && isEmptyValue(value);
	const triggerId = `${id}trigger`;
	const popupId = `${id}popup`;

	const ctx = useMemo(
		(): RootContextValue => ({
			open,
			mounted,
			disabled,
			value,
			items,
			selectedItem,
			placeholder,
			openMethod,
			openEntry,
			anchorName,
			triggerId,
			popupId,
			triggerRef,
			positionerRef,
			popupRef,
			typeahead,
			setOpen,
			select,
			onTransitionSettled,
		}),
		[
			open,
			mounted,
			disabled,
			value,
			items,
			selectedItem,
			placeholder,
			openMethod,
			openEntry,
			anchorName,
			triggerId,
			popupId,
			typeahead,
			setOpen,
			select,
			onTransitionSettled,
		],
	);

	return <RootContext.Provider value={ctx}>{children}</RootContext.Provider>;
};

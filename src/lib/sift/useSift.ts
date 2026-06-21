/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useId, useRef, useState } from 'react';
import type { ViewStyle } from 'react-native';

import { useSafeAreaFrame, useSafeAreaInsets } from '#/lib/hooks/use-safe-area';

import { computeStyles } from './computeStyles';

const DEFAULT_POPOVER_STYLES: ViewStyle = { position: 'absolute' };

export type Placement = 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end';

export type UseSiftReturn = ReturnType<typeof useSift>;

export function useSift({
	offset: offsetValue = 0,
	placement = 'bottom',
	dynamicWidth = false,
}: {
	offset?: number;
	placement?: Placement;
	dynamicWidth?: boolean;
} = {}) {
	const id = useId();
	const insets = useSafeAreaInsets();
	const window = useSafeAreaFrame();

	/*
	 * These are reactive values and need to remain in state
	 */
	const [input, setInput] = useState<any>(null);
	const [popover, setPopover] = useState<any>(null);
	const [popoverStyles, setPopoverStyles] = useState<ViewStyle>(DEFAULT_POPOVER_STYLES);

	/*
	 * These are non-reactive values that we want to persist across renders
	 * without causing re-renders when they change, so we store them in refs.
	 */
	const inputRef = useRef<any>(null);
	const popoverRef = useRef<any>(null);
	const anchorRef = useRef<any>(null);
	const options = useRef({
		offset: offsetValue,
		placement,
		dynamicWidth,
		insets,
		window,
	});
	options.current = {
		offset: offsetValue,
		placement,
		dynamicWidth,
		insets,
		window,
	};

	const update = useCallback(() => {
		if (!inputRef.current || !popoverRef.current) return;
		const styles = computeStyles(
			{
				anchor: anchorRef.current || inputRef.current,
				input: inputRef.current,
				popover: popoverRef.current,
			},
			options.current,
		);
		if (styles) setPopoverStyles(styles);
	}, []);

	const handleSetInput = useCallback((node: any) => {
		inputRef.current = node;
		setInput(node);
	}, []);

	const handleSetPopover = useCallback(
		(node: any) => {
			popoverRef.current = node;
			setPopover(node);
			if (node) {
				update();
			} else {
				setPopoverStyles(DEFAULT_POPOVER_STYLES);
			}
		},
		[update],
	);

	const handleSetAnchor = useCallback(
		(node: any) => {
			// React's ref-callback churn (cleanup-with-null then setup-with-node)
			// fires whenever a caller produces a fresh ref callback per render
			// (e.g. `ref={mergeRefs(...)}`). Without this guard, every render of
			// the consumer would call `update()` → `setPopoverStyles`, which in
			// turn re-renders the consumer — an infinite loop. Ignoring nulls is
			// safe: if the anchor truly unmounts, `computeStyles` bails on the
			// resulting zero-sized rect and `setPopoverStyles` is never called.
			if (!node) return;
			if (node === anchorRef.current) return;
			anchorRef.current = node;
			update();
		},
		[update],
	);

	return {
		id,
		refs: {
			setPopover: handleSetPopover,
			setAnchor: handleSetAnchor,
		},
		elements: {
			input,
			popover,
		},
		isActive() {
			return !!popover;
		},
		popoverStyles,
		updatePosition: update,
		targetProps: {
			ref: handleSetInput,
			role: 'combobox' as const,
			'aria-controls': id,
			'aria-expanded': !!popover,
			'aria-autocomplete': 'list' as const,
		},
	};
}

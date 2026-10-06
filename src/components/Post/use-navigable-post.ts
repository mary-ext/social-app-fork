import { type KeyboardEvent, useRef } from 'react';

import { useFocusWithin } from '#/lib/hooks/use-focus-within';
import { useKeybind } from '#/lib/keybinds';

import { findOwnImagesTrigger } from '#/components/ImageEmbed';
import { KEYBINDS } from '#/components/keybind-catalog';
import { listItemProps } from '#/components/List/keyboard-navigation';
import { findOverflowMenuTrigger } from '#/components/PostControls/PostOverflowMenuButton';

/**
 * makes a post focusable for list navigation. while focus is within it, the open keybind opens its images or
 * calls `onOpen`, and the post menu keybind opens its overflow menu. Enter calls `onOpen` only when the frame
 * itself is focused.
 *
 * @param onOpen opens the post from its frame; use the row's click handler to retain profile caching and
 *   clickthrough logging. omit for an already-open post
 * @returns `focusWithin` for action keybinds and `itemProps` to spread onto the frame
 */
export const useNavigablePost = (onOpen?: (frame: HTMLDivElement) => void) => {
	const frameRef = useRef<HTMLDivElement>(null);
	const { focusWithin, focusProps } = useFocusWithin();

	useKeybind({
		keybind: KEYBINDS.open,
		enabled: focusWithin,
		handle() {
			const frame = frameRef.current!;
			const images = findOwnImagesTrigger(frame);

			if (images !== null) {
				images.click();
			} else {
				onOpen?.(frame);
			}
		},
	});

	useKeybind({
		keybind: KEYBINDS.postMenu,
		enabled: focusWithin,
		handle() {
			findOverflowMenuTrigger(frameRef.current!)?.click();
		},
	});

	const onKeyDown = (ev: KeyboardEvent<HTMLDivElement>) => {
		if (ev.key === 'Enter' && ev.target === ev.currentTarget && onOpen !== undefined) {
			ev.preventDefault();
			onOpen(ev.currentTarget);
		}
	};

	return { focusWithin, itemProps: { ...listItemProps, ...focusProps, onKeyDown, ref: frameRef } };
};

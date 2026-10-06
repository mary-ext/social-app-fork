import { type KeyboardEvent, useRef } from 'react';

import { useFocusWithin } from '#/lib/hooks/use-focus-within';
import { useKeybind } from '#/lib/keybinds';

import { findOwnImagesTrigger } from '#/components/ImageEmbed';
import { KEYBINDS } from '#/components/keybind-catalog';
import { listItemProps } from '#/components/List/keyboard-navigation';
import { findOverflowMenuTrigger } from '#/components/PostControls/PostOverflowMenuButton';

/**
 * makes a post focusable for list navigation. while focus is within it, the open keybind opens its images or
 * the post itself, and the post menu keybind opens its overflow menu. Enter opens the post only when the
 * frame itself is focused.
 *
 * the post opens by clicking the element attached to `linkRef`, or the frame when it's left unattached, so it
 * goes through the same press handling (profile caching, clickthrough logging) as a pointer would.
 *
 * @returns `focusWithin` for action keybinds, `itemProps` to spread onto the frame, and `linkRef` for a link
 *   that isn't the frame itself
 */
export const useNavigablePost = () => {
	const frameRef = useRef<HTMLDivElement>(null);
	const linkRef = useRef<HTMLElement>(null);
	const { focusWithin, focusProps } = useFocusWithin();

	const open = () => {
		(linkRef.current ?? frameRef.current)?.click();
	};

	useKeybind({
		keybind: KEYBINDS.open,
		enabled: focusWithin,
		handle() {
			const images = findOwnImagesTrigger(frameRef.current!);

			if (images !== null) {
				images.click();
			} else {
				open();
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
		if (ev.key === 'Enter' && ev.target === ev.currentTarget) {
			ev.preventDefault();
			open();
		}
	};

	return { focusWithin, itemProps: { ...listItemProps, ...focusProps, onKeyDown, ref: frameRef }, linkRef };
};

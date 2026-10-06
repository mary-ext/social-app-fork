import { type KeyboardEvent, useRef } from 'react';

import { useFocusWithin } from '#/lib/hooks/use-focus-within';
import { useKeybind } from '#/lib/keybinds';

import { findOwnImagesTrigger } from '#/components/ImageEmbed';
import { KEYBINDS } from '#/components/keybind-catalog';
import { listItemProps } from '#/components/List/keyboard-navigation';
import { findOverflowMenuTrigger } from '#/components/PostControls/PostOverflowMenuButton';

/**
 * makes a post focusable for list navigation, with image/menu keybinds while it contains focus. Enter
 * activates the post only when its frame is focused.
 *
 * @returns `itemProps` for the frame, `focusWithin` for action keybinds, and `linkRef` to override the frame
 *   as the Enter click target
 */
export const useNavigablePost = () => {
	const frameRef = useRef<HTMLDivElement>(null);
	const linkRef = useRef<HTMLElement>(null);
	const { focusWithin, focusProps } = useFocusWithin();

	useKeybind({
		keybind: KEYBINDS.openImages,
		enabled: focusWithin,
		handle() {
			findOwnImagesTrigger(frameRef.current!)?.click();
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
			// reuse click handling for navigation, profile caching, and interaction logging
			(linkRef.current ?? ev.currentTarget).click();
		}
	};

	return { focusWithin, itemProps: { ...listItemProps, ...focusProps, onKeyDown, ref: frameRef }, linkRef };
};

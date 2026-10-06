import { lazy, type ReactElement, type ReactNode, Suspense, useRef, useState } from 'react';

import type { AppBskyFeedDefs } from '@atcute/bluesky';

import { useKeybind } from '#/lib/keybinds';

import type { Shadow } from '#/state/cache/post-shadow';

import { KEYBINDS } from '#/components/keybind-catalog';
import * as Menu from '#/components/Menu';
import { Tooltip } from '#/components/Tooltip';

const importShareMenuItems = () =>
	import('./ShareMenuItems').then((mod) => ({ default: mod.ShareMenuItems }));

const ShareMenuItems = lazy(importShareMenuItems);

/**
 * The share menu. The caller supplies the trigger button via `render` so each action-bar size owns its own
 * button chrome.
 */
export const ShareMenu = ({
	render,
	tooltip,
	post,
	keybindEnabled,
	onShare,
}: {
	render: ReactElement;
	/** Hover/focus hint for the trigger; the tooltip wraps the menu trigger so it survives the menu wiring. */
	tooltip: string;
	post: Shadow<AppBskyFeedDefs.PostView>;
	keybindEnabled: boolean;
	onShare: () => void;
}): ReactNode => {
	// the items run a stack of hooks; only mount them once the menu has been opened.
	const [hasBeenOpen, setHasBeenOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);

	useKeybind({
		keybind: KEYBINDS.share,
		enabled: keybindEnabled,
		handle() {
			triggerRef.current?.click();
		},
	});

	return (
		<Menu.Root
			onOpenChange={(open) => {
				if (open) {
					setHasBeenOpen(true);
				}
			}}
		>
			<Tooltip label={tooltip}>
				<Menu.Trigger
					ref={triggerRef}
					render={render}
					onFocus={() => void importShareMenuItems()}
					onPointerEnter={() => void importShareMenuItems()}
				/>
			</Tooltip>
			{hasBeenOpen && (
				<Suspense fallback={null}>
					<ShareMenuItems post={post} onShare={onShare} />
				</Suspense>
			)}
		</Menu.Root>
	);
};

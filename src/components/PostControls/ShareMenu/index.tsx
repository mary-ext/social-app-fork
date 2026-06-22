import { type ReactElement, useState } from 'react';
import type { AppBskyFeedDefs } from '@atcute/bluesky';

import type { Shadow } from '#/state/cache/post-shadow';

import * as Menu from '#/components/web/Menu';

import { ShareMenuItems } from './ShareMenuItems';

/**
 * The share menu. The caller supplies the trigger button via `render` so each action-bar size owns its own
 * button chrome.
 */
export const ShareMenu = ({
	render,
	post,
	onShare,
}: {
	render: ReactElement;
	post: Shadow<AppBskyFeedDefs.PostView>;
	onShare: () => void;
}): React.ReactNode => {
	// the items run a stack of hooks; only mount them once the menu has been opened.
	const [hasBeenOpen, setHasBeenOpen] = useState(false);

	return (
		<Menu.Root
			onOpenChange={(open) => {
				if (open) {
					setHasBeenOpen(true);
				}
			}}
		>
			<Menu.Trigger render={render} />
			{hasBeenOpen && <ShareMenuItems post={post} onShare={onShare} />}
		</Menu.Root>
	);
};

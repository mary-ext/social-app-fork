import { type ReactElement, useState } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';

import type { Shadow } from '#/state/cache/types';

import { type BlockInfo, ConvoMenuItems } from '#/components/dms/ConvoMenu/ConvoMenuItems';
import type { ConvoWithDetails } from '#/components/dms/util';
import * as Menu from '#/components/Menu';

/**
 * The conversation overflow menu. The caller supplies the trigger button via `render`, and may pass a
 * `handle`/`triggerId` pair to open the menu imperatively from elsewhere in the row.
 */
export function ConvoMenu({
	render,
	convo,
	profile,
	handle,
	triggerId,
	currentScreen,
	showMarkAsRead,
	blockInfo,
}: {
	render: ReactElement;
	convo: ConvoWithDetails;
	profile: Shadow<AnyProfileView>;
	handle?: Menu.MenuHandle;
	triggerId?: string;
	currentScreen: 'list' | 'conversation';
	showMarkAsRead?: boolean;
	blockInfo: BlockInfo;
}): React.ReactNode {
	// the items run a stack of hooks; only mount them once the menu has been opened.
	const [hasBeenOpen, setHasBeenOpen] = useState(false);

	return (
		<Menu.Root
			handle={handle}
			onOpenChange={(open) => {
				if (open) {
					setHasBeenOpen(true);
				}
			}}
		>
			<Menu.Trigger handle={handle} id={triggerId} render={render} />
			{hasBeenOpen && (
				<ConvoMenuItems
					blockInfo={blockInfo}
					convo={convo}
					currentScreen={currentScreen}
					profile={profile}
					showMarkAsRead={showMarkAsRead}
				/>
			)}
		</Menu.Root>
	);
}

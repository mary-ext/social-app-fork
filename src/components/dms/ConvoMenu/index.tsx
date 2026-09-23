import { lazy, type ReactElement, type ReactNode, Suspense, useState } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';

import type { Shadow } from '#/state/cache/types';

import type { BlockInfo } from '#/components/dms/ConvoMenu/ConvoMenuItems';
import type { ConvoWithDetails } from '#/components/dms/util';
import * as Menu from '#/components/Menu';

const importConvoMenuItems = () =>
	import('#/components/dms/ConvoMenu/ConvoMenuItems').then((mod) => ({ default: mod.ConvoMenuItems }));

const ConvoMenuItems = lazy(importConvoMenuItems);

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
}): ReactNode {
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
			<Menu.Trigger
				handle={handle}
				id={triggerId}
				render={render}
				onFocus={() => void importConvoMenuItems()}
				onPointerEnter={() => void importConvoMenuItems()}
			/>
			{hasBeenOpen && (
				<Suspense fallback={null}>
					<ConvoMenuItems
						blockInfo={blockInfo}
						convo={convo}
						currentScreen={currentScreen}
						profile={profile}
						showMarkAsRead={showMarkAsRead}
					/>
				</Suspense>
			)}
		</Menu.Root>
	);
}

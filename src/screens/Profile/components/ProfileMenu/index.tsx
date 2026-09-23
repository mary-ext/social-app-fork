import { lazy, type ReactElement, type ReactNode, Suspense, useState } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';

import type { Shadow } from '#/state/cache/types';

import * as Menu from '#/components/Menu';

const importProfileMenuItems = () =>
	import('./ProfileMenuItems').then((mod) => ({ default: mod.ProfileMenuItems }));

const ProfileMenuItems = lazy(importProfileMenuItems);

/**
 * profile overflow menu
 *
 * @param profile menu subject
 * @param render trigger element
 */
export function ProfileMenu({
	profile,
	render,
}: {
	profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>;
	render: ReactElement;
}): ReactNode {
	const [hasBeenOpen, setHasBeenOpen] = useState(false);

	return (
		<Menu.Root
			onOpenChange={(open) => {
				if (open) {
					setHasBeenOpen(true);
				}
			}}
		>
			<Menu.Trigger
				render={render}
				onFocus={() => void importProfileMenuItems()}
				onPointerEnter={() => void importProfileMenuItems()}
			/>
			{hasBeenOpen && (
				<Suspense fallback={null}>
					<ProfileMenuItems profile={profile} />
				</Suspense>
			)}
		</Menu.Root>
	);
}

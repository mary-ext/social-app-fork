import { type ReactElement, type ReactNode, useState } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';

import type { Shadow } from '#/state/cache/types';

import * as Menu from '#/components/Menu';

import { ProfileMenuItems } from './ProfileMenuItems';

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
			<Menu.Trigger render={render} />
			{hasBeenOpen && <ProfileMenuItems profile={profile} />}
		</Menu.Root>
	);
}

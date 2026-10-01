import type { AppBskyActorDefs } from '@atcute/bluesky';

import { UserAvatar } from '#/components/UserAvatar';

import { AVATAR_SIZE } from '../shared/layout';

/**
 * author avatar, using the labeler shape when applicable.
 *
 * @param props the profile, size in pixels (defaults to AVATAR_SIZE), and whether to omit the border
 * @returns the avatar
 */
export function Avatar({
	profile,
	size = AVATAR_SIZE,
	noBorder,
}: {
	profile: AppBskyActorDefs.ProfileViewDetailed | undefined;
	size?: number;
	noBorder?: boolean;
}) {
	return (
		<UserAvatar
			avatar={profile?.avatar}
			size={size}
			type={profile?.associated?.labeler ? 'labeler' : 'user'}
			noBorder={noBorder}
		/>
	);
}

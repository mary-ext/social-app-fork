import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { DisplayRestrictions } from '@atcute/bluesky-moderation';

import { UserAvatar } from '#/components/UserAvatar';

import { AVATAR_SIZE } from '../shared/layout';

/**
 * author avatar, using the labeler shape when applicable.
 *
 * @param props profile, size in pixels (default: AVATAR_SIZE), border visibility, and media restrictions
 * @returns the avatar
 */
export function Avatar({
	profile,
	size = AVATAR_SIZE,
	noBorder,
	moderation,
}: {
	profile: AppBskyActorDefs.ProfileViewBasic | AppBskyActorDefs.ProfileViewDetailed | undefined;
	size?: number;
	noBorder?: boolean;
	moderation?: DisplayRestrictions;
}) {
	return (
		<UserAvatar
			avatar={profile?.avatar}
			size={size}
			type={profile?.associated?.labeler ? 'labeler' : 'user'}
			noBorder={noBorder}
			moderation={moderation}
		/>
	);
}

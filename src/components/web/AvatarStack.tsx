import type { AnyProfileView } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';

import { assignInlineVars } from '@vanilla-extract/dynamic';

import { UserAvatar } from '#/components/UserAvatar';
import * as css from '#/components/web/AvatarStack.css';

/**
 * a row of overlapping circular avatars, with earlier profiles painted on top and masked to cut a transparent
 * gap over the next. renders placeholder circles if profiles are loading.
 */
export function AvatarStack({
	moderationOpts,
	numPending,
	profiles,
	size = 30,
}: {
	moderationOpts: ModerationOptions | undefined;
	numPending?: number;
	profiles: AnyProfileView[];
	size?: number;
}) {
	const isPending = (numPending && profiles.length === 0) || !moderationOpts;

	const items = isPending
		? Array.from({ length: numPending ?? profiles.length }, (_, i) => ({ key: i, profile: null }))
		: profiles.map((profile) => ({ key: profile.did, profile }));

	return (
		<div className={css.stack} style={assignInlineVars({ [css.sizeVar]: `${size}px` })}>
			{items.map((item, i) => (
				<div
					key={item.key}
					className={css.avatar}
					style={assignInlineVars({ [css.stackOrder]: String(items.length - i) })}
				>
					{item.profile && moderationOpts ? (
						<UserAvatar
							avatar={item.profile.avatar}
							moderation={getDisplayRestrictions(
								moderateProfile(item.profile, moderationOpts),
								DisplayContext.ProfileMedia,
							)}
							noBorder
							size={size}
							type={item.profile.associated?.labeler ? 'labeler' : 'user'}
						/>
					) : (
						<div className={css.placeholder} />
					)}
				</div>
			))}
		</div>
	);
}

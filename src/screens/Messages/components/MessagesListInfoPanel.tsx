import { DisplayContext, getDisplayRestrictions, moderateProfile } from '@atcute/bluesky-moderation';

import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';
import { isInvalidHandle } from '#/lib/strings/handles';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useSession } from '#/state/session';

import type { ConvoWithDetails } from '#/components/dms/util';
import { Person_Stroke2_Corner2_Rounded as PersonIcon } from '#/components/icons/Person';
import { ProfileBadges } from '#/components/ProfileBadges';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';
import { useNavigate } from '#/routes';

import * as css from './MessagesListInfoPanel.css';

export function MessagesListInfoPanel({ convo }: { convo: Extract<ConvoWithDetails, { kind: 'direct' }> }) {
	const navigate = useNavigate();
	const { currentAccount } = useSession();
	const moderationOpts = useModerationOpts();

	const profile = convo.members.find((member) => member.did !== currentAccount?.did);
	if (!profile) {
		return null;
	}

	const handle = `@${profile.handle}`;
	const displayName = moderationOpts
		? createSanitizedDisplayName(
				profile,
				true,
				getDisplayRestrictions(moderateProfile(profile, moderationOpts), DisplayContext.ProfileBio),
			)
		: handle;
	const profileLink = profile.handle && !isInvalidHandle(profile.handle) ? profile.handle : profile.did;

	return (
		<div className={css.root}>
			<UserAvatar avatar={profile.avatar} size={88} type="user" />
			<div className={css.nameRow}>
				<Text color="text" size="_2xl" weight="bold">
					{displayName}
				</Text>
				<ProfileBadges profile={profile} size="lg" />
			</div>
			<Text className={css.handle} color="textContrastHigh" size="sm">
				{handle}
			</Text>
			{moderationOpts ? (
				<div className={css.labels}>
					<ProfileCard.Labels moderationOpts={moderationOpts} profile={profile} />
				</div>
			) : null}
			<div className={css.buttonRow}>
				<Button
					color="secondary"
					label={m['common.profile.a11y.goTo']()}
					onClick={() => {
						navigate('Profile', { actor: profileLink });
					}}
					size="small"
				>
					<ButtonIcon icon={PersonIcon} />
					<ButtonText>{m['common.profile.action.goTo']()}</ButtonText>
				</Button>
			</div>
		</div>
	);
}

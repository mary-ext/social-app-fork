import { DisplayContext, getDisplayRestrictions, moderateProfile } from '@atcute/bluesky-moderation';

import { isInvalidHandle, sanitizeDisplayName } from '#/lib/display-names';
import { profileTarget } from '#/lib/routes/targets';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useSession } from '#/state/session';

import type { ConvoWithDetails } from '#/components/dms/util';
import { ProfileBadges } from '#/components/ProfileBadges';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as ProfileCard from '#/components/web/ProfileCard';

import PersonIcon from '#/icons/central/People_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useRouter } from '#/router';

import * as css from './MessagesListInfoPanel.css';

export function MessagesListInfoPanel({ convo }: { convo: Extract<ConvoWithDetails, { kind: 'direct' }> }) {
	const router = useRouter();
	const { currentAccount } = useSession();
	const moderationOpts = useModerationOpts();

	const profile = convo.members.find((member) => member.did !== currentAccount?.did);
	if (!profile) {
		return null;
	}

	const displayName =
		moderationOpts && profile.displayName
			? sanitizeDisplayName(
					profile.displayName,
					getDisplayRestrictions(moderateProfile(profile, moderationOpts), DisplayContext.ProfileBio),
				)
			: '';
	const profileLink = profile.handle && !isInvalidHandle(profile.handle) ? profile.handle : profile.did;

	return (
		<div className={css.root}>
			<UserAvatar avatar={profile.avatar} size={88} type={profile.associated?.labeler ? 'labeler' : 'user'} />
			<div className={css.nameRow}>
				<Text color="text" size="_2xl" weight="bold">
					{profile.handle}
				</Text>
				<ProfileBadges profile={profile} size="lg" />
			</div>
			{displayName ? (
				<Text className={css.handle} color="textContrastHigh" size="sm">
					{displayName}
				</Text>
			) : null}
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
						router.navigate({ to: profileTarget(profileLink) });
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

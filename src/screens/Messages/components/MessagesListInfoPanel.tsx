import { View } from 'react-native';

import { DisplayContext, getDisplayRestrictions, moderateProfile } from '@atcute/bluesky-moderation';

import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';
import { isInvalidHandle } from '#/lib/strings/handles';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useSession } from '#/state/session';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import type { ConvoWithDetails } from '#/components/dms/util';
import { Person_Stroke2_Corner2_Rounded as PersonIcon } from '#/components/icons/Person';
import { ProfileBadges } from '#/components/ProfileBadges';
import * as ProfileCard from '#/components/ProfileCard';
import { Text } from '#/components/Typography';
import { UserAvatar } from '#/components/UserAvatar';

import { m } from '#/paraglide/messages';
import { useNavigate } from '#/routes';

export function MessagesListInfoPanel({ convo }: { convo: Extract<ConvoWithDetails, { kind: 'direct' }> }) {
	const navigate = useNavigate();
	const t = useTheme();
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
		<View style={[a.align_center, a.justify_center]}>
			<UserAvatar type="user" size={88} avatar={profile.avatar} />
			<View style={[a.flex_row, a.align_center, a.justify_center, a.gap_xs, a.mt_lg]}>
				<Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>{displayName}</Text>
				<ProfileBadges profile={profile} size="lg" />
			</View>
			<Text style={[a.text_sm, a.mt_xs, t.atoms.text_contrast_high]}>{handle}</Text>
			{moderationOpts ? (
				<View style={[a.mt_xs]}>
					<ProfileCard.Labels profile={profile} moderationOpts={moderationOpts} />
				</View>
			) : null}
			<View style={[a.flex_row, a.align_center, a.justify_center, a.gap_sm, a.mt_lg, a.mb_4xl]}>
				<Button
					color="secondary"
					size="small"
					label={m['common.profile.a11y.goTo']()}
					onPress={() => {
						navigate('Profile', { actor: profileLink });
					}}
				>
					<ButtonIcon icon={PersonIcon} />
					<ButtonText>{m['common.profile.action.goTo']()}</ButtonText>
				</Button>
			</View>
		</View>
	);
}

import { View } from 'react-native';
import type { AnyProfileView } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';

import { sanitizeDisplayName } from '#/lib/strings/display-names';

import { atoms as a, useTheme } from '#/alf';

import { canBeAddedToGroup } from '#/components/dms/util';
import * as Toggle from '#/components/forms/Toggle';
import * as ProfileCard from '#/components/ProfileCard';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

export function GroupChatProfileCard({
	profile,
	moderationOpts,
}: {
	profile: AnyProfileView;
	moderationOpts: ModerationOptions;
}) {
	const t = useTheme();
	const enabled = canBeAddedToGroup(profile);
	const moderation = moderateProfile(profile, moderationOpts);
	const handle = `@${profile.handle}`;
	const displayName = sanitizeDisplayName(
		profile.displayName || profile.handle,
		getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
	);

	return (
		<Toggle.Item
			key={profile.did}
			disabled={!enabled}
			name={profile.did}
			label={displayName}
			style={[a.flex_1, a.py_sm, a.px_lg]}
		>
			{({ disabled, selected }) => (
				<>
					<View style={[a.flex_grow, !enabled || (disabled && !selected) ? { opacity: 0.5 } : null]}>
						<ProfileCard.Header>
							<ProfileCard.Avatar
								profile={profile}
								moderationOpts={moderationOpts}
								size={44}
								disabledPreview
							/>
							<View style={[a.flex_1]}>
								<ProfileCard.Name profile={profile} moderationOpts={moderationOpts} />
								{enabled ? (
									<ProfileCard.Handle profile={profile} />
								) : (
									<Text style={[a.leading_snug, t.atoms.text_contrast_high]} numberOfLines={2}>
										{m['components.dms.recipient.error.cannotAdd']({ handle })}
									</Text>
								)}
							</View>
						</ProfileCard.Header>
					</View>
					{enabled ? <Toggle.Checkbox /> : null}
				</>
			)}
		</Toggle.Item>
	);
}

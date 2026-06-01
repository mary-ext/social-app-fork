import { View } from 'react-native';
import type { AppBskyActorDefs } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, type ModerationDecision } from '@atcute/bluesky-moderation';

import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { sanitizeHandle } from '#/lib/strings/handles';

import type { Shadow } from '#/state/cache/types';

import { atoms as a, useBreakpoints, useTheme } from '#/alf';

import { Text } from '#/components/Typography';

export function ProfileHeaderDisplayName({
	profile,
	moderation,
}: {
	profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>;
	moderation: ModerationDecision;
}) {
	const t = useTheme();
	const { gtMobile } = useBreakpoints();

	return (
		<View pointerEvents="none">
			<Text
				emoji
				testID="profileHeaderDisplayName"
				style={[t.atoms.text, gtMobile ? a.text_4xl : a.text_3xl, a.self_start, a.font_bold]}
			>
				{sanitizeDisplayName(
					profile.displayName || sanitizeHandle(profile.handle),
					getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
				)}
			</Text>
		</View>
	);
}

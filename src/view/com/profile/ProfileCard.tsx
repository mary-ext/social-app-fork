import { type GestureResponderEvent, View } from 'react-native';
import type { AnyProfileView } from '@atcute/bluesky';

import { useModerationOpts } from '#/state/preferences/moderation-opts';

import { atoms as a, useTheme } from '#/alf';

import * as ProfileCard from '#/components/ProfileCard';

export function ProfileCardWithFollowBtn({
	profile,
	noBorder,
	onPress,
}: {
	profile: AnyProfileView;
	noBorder?: boolean;
	onPress?: (e: GestureResponderEvent) => void;
}) {
	const t = useTheme();
	const moderationOpts = useModerationOpts();

	if (!moderationOpts) return null;

	return (
		<View style={[a.py_md, a.px_xl, !noBorder && [a.border_t, t.atoms.border_contrast_low]]}>
			<ProfileCard.Default profile={profile} moderationOpts={moderationOpts} onPress={onPress} />
		</View>
	);
}

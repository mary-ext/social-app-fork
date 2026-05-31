import { type StyleProp, type ViewStyle } from 'react-native';
import { DisplayContext, getDisplayRestrictions, type ModerationDecision } from '@atcute/bluesky-moderation';

import { getModerationCauseKey, unique } from '#/lib/moderation';

import * as Pills from '#/components/Pills';

export function ProfileHeaderAlerts({
	moderation,
	style,
}: {
	moderation: ModerationDecision;
	style?: StyleProp<ViewStyle>;
}) {
	const modui = getDisplayRestrictions(moderation, DisplayContext.ProfileView);
	if (modui.alerts.length === 0 && modui.informs.length === 0) {
		return null;
	}

	return (
		<Pills.Row size="lg" style={style}>
			{modui.alerts.filter(unique).map((cause) => (
				<Pills.Label size="lg" key={getModerationCauseKey(cause)} cause={cause} />
			))}
			{modui.informs.filter(unique).map((cause) => (
				<Pills.Label size="lg" key={getModerationCauseKey(cause)} cause={cause} />
			))}
		</Pills.Row>
	);
}

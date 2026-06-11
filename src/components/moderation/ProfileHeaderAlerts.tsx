import { DisplayContext, getDisplayRestrictions, type ModerationDecision } from '@atcute/bluesky-moderation';

import { getModerationCauseKey, unique } from '#/lib/moderation';

import * as Pills from '#/components/web/Pills';

export function ProfileHeaderAlerts({
	className,
	moderation,
}: {
	className?: string;
	moderation: ModerationDecision;
}) {
	const modui = getDisplayRestrictions(moderation, DisplayContext.ProfileView);
	if (modui.alerts.length === 0 && modui.informs.length === 0) {
		return null;
	}

	return (
		<Pills.Row className={className} size="lg">
			{modui.alerts.filter(unique).map((cause) => (
				<Pills.Label cause={cause} key={getModerationCauseKey(cause)} size="lg" />
			))}
			{modui.informs.filter(unique).map((cause) => (
				<Pills.Label cause={cause} key={getModerationCauseKey(cause)} size="lg" />
			))}
		</Pills.Row>
	);
}

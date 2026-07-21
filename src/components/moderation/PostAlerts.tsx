import type { DisplayRestrictions, ModerationCause } from '@atcute/bluesky-moderation';

import { uniqueBy } from '@mary/array-fns';

import { clsx } from 'clsx';

import { getModerationCauseKey } from '#/lib/moderation';

import * as Pills from '#/components/web/Pills';

import * as styles from './PostAlerts.css';

export function PostAlerts({
	additionalCauses,
	className,
	modui,
	size = 'sm',
}: {
	additionalCauses?: ModerationCause[] | Pills.AppModerationCause[];
	className?: string;
	modui: DisplayRestrictions;
	size?: Pills.CommonProps['size'];
}) {
	if (modui.alerts.length === 0 && modui.informs.length === 0 && !additionalCauses?.length) {
		return null;
	}

	return (
		<Pills.Row className={clsx(size === 'sm' && styles.smOffset, className)} size={size}>
			{uniqueBy(modui.alerts, getModerationCauseKey).map((cause) => (
				<Pills.Label cause={cause} key={getModerationCauseKey(cause)} noBg={size === 'sm'} size={size} />
			))}
			{uniqueBy(modui.informs, getModerationCauseKey).map((cause) => (
				<Pills.Label cause={cause} key={getModerationCauseKey(cause)} noBg={size === 'sm'} size={size} />
			))}
			{additionalCauses?.map((cause) => (
				<Pills.Label cause={cause} key={getModerationCauseKey(cause)} noBg={size === 'sm'} size={size} />
			))}
		</Pills.Row>
	);
}

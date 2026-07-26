import { useState } from 'react';

import { useTick } from '#/state/tick';

import { formatTimeAgo } from '#/locale/intl/timeAgo';

export function TimeElapsed({
	children,
	timestamp,
}: {
	children: ({ timeElapsed }: { timeElapsed: string }) => React.ReactElement;
	timestamp: string;
}) {
	const tick = useTick();
	const [timeElapsed, setTimeElapsed] = useState(() => formatTimeAgo(timestamp, tick));

	const [prevTick, setPrevTick] = useState(tick);
	const [prevTimestamp, setPrevTimestamp] = useState(timestamp);

	if (prevTick !== tick || prevTimestamp !== timestamp) {
		setPrevTick(tick);
		setPrevTimestamp(timestamp);
		setTimeElapsed(formatTimeAgo(timestamp, tick));
	}

	return children({ timeElapsed });
}

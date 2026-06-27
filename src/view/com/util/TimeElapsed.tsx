import { useState } from 'react';

import { useTickEveryMinute } from '#/state/shell';

import { useGetTimeAgo } from '#/locale/intl/timeAgo';

export function TimeElapsed({
	timestamp,
	children,
}: {
	timestamp: string;
	children: ({ timeElapsed }: { timeElapsed: string }) => React.ReactElement;
}) {
	const ago = useGetTimeAgo();
	const tick = useTickEveryMinute();
	const [timeElapsed, setTimeElapsed] = useState(() => ago(timestamp, tick));

	const [prevTick, setPrevTick] = useState(tick);
	const [prevTimestamp, setPrevTimestamp] = useState(timestamp);

	if (prevTick !== tick || prevTimestamp !== timestamp) {
		setPrevTick(tick);
		setPrevTimestamp(timestamp);
		setTimeElapsed(ago(timestamp, tick));
	}

	return children({ timeElapsed });
}

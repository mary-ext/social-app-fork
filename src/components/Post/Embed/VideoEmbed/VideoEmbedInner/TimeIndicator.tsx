import type { RefObject } from 'react';

import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import * as styles from './TimeIndicator.css';
import { formatTime, useVideoTime } from './web-controls/utils';

export function TimeIndicator({
	videoRef,
	duration,
}: {
	videoRef: RefObject<HTMLVideoElement | null>;
	duration: number;
}) {
	const remaining = Math.floor(duration - useVideoTime(videoRef, 1));

	return (
		<div
			aria-label={m['components.post.video.a11y.timeRemaining']({ time: remaining })}
			className={styles.indicator}
		>
			<Text size="sm" weight="semiBold" className={styles.text}>
				{formatTime(remaining)}
			</Text>
		</div>
	);
}

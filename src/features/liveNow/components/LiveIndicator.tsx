import type { CSSProperties } from 'react';

import { clsx } from 'clsx';

import { Text } from '#/components/Text';

import * as styles from '#/features/liveNow/components/LiveIndicator.css';
import { m } from '#/paraglide/messages';

export function LiveIndicator({
	className,
	size = 'small',
	style,
}: {
	className?: string;
	size?: 'large' | 'small' | 'tiny';
	style?: CSSProperties;
}) {
	return (
		<div className={clsx(styles.container({ size }), className)} style={style}>
			<Text className={styles.pill({ size })} align="center" color="white" weight="semiBold">
				{m['features.liveNow.badge.live']()}
			</Text>
		</div>
	);
}

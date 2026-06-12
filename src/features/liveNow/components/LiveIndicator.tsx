import type { CSSProperties } from 'react';
import { Trans } from '@lingui/react/macro';
import { clsx } from 'clsx';

import { Text } from '#/components/Text';

import * as styles from '#/features/liveNow/components/LiveIndicator.css';

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
				<Trans comment="Live status indicator on avatar. Should be extremely short, not much space for more than 4 characters">
					LIVE
				</Trans>
			</Text>
		</div>
	);
}

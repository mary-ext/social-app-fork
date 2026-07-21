import { clsx } from 'clsx';

import { Text } from '#/components/Text';

import * as styles from '#/features/liveNow/components/LiveIndicator.css';
import { m } from '#/paraglide/messages';

export function LiveIndicator({
	className,
	size = 'small',
}: {
	className?: string;
	size?: 'large' | 'small' | 'tiny';
}) {
	return (
		<div className={clsx(styles.container({ size }), className)}>
			<Text className={styles.pill({ size })} align="center" color="white" weight="semiBold">
				{m['features.liveNow.badge.live']()}
			</Text>
		</div>
	);
}

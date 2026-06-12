import type { ReactNode } from 'react';
import { clsx } from 'clsx';

import { Text } from '#/components/Text';

import * as styles from './ItemTextWithSubtitle.css';

export function ItemTextWithSubtitle({
	bold = false,
	showSkeleton = false,
	subtitleText,
	titleText,
}: {
	bold?: boolean;
	showSkeleton?: boolean;
	subtitleText: ReactNode;
	titleText: ReactNode;
}) {
	return (
		<div className={clsx(styles.container, bold && styles.containerBold)}>
			<Text size={bold ? 'lg' : 'md'} weight={bold ? 'semiBold' : 'normal'}>
				{titleText}
			</Text>
			{showSkeleton ? (
				<div className={styles.skeleton} />
			) : (
				<Text color="textContrastMedium" leading="snug" size="sm">
					{subtitleText}
				</Text>
			)}
		</div>
	);
}

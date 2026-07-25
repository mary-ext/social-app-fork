import { clsx } from 'clsx';

import { MAX_GRAPHEME_LENGTH } from '#/lib/constants';

import { ProgressCircle, ProgressPie } from '#/components/ProgressCircle';
import { Text } from '#/components/Text';

import { colors } from '#/styles/colors';

import * as styles from './CharProgress.css';

export function CharProgress({ count, className }: { count: number; className?: string }) {
	const isOverLimit = count > MAX_GRAPHEME_LENGTH;
	const circleColor = isOverLimit ? styles.overLimitColor : colors.primary_500;
	return (
		<div className={clsx(styles.container, className)}>
			<Text size="md_sub" className={clsx(styles.count, isOverLimit && styles.countOver)}>
				{MAX_GRAPHEME_LENGTH - count}
			</Text>

			{isOverLimit ? (
				<ProgressPie
					borderColor={circleColor}
					borderWidth={4}
					color={circleColor}
					progress={Math.min((count - MAX_GRAPHEME_LENGTH) / MAX_GRAPHEME_LENGTH, 1)}
					size={20}
				/>
			) : (
				<ProgressCircle
					color={circleColor}
					progress={count / MAX_GRAPHEME_LENGTH}
					size={20}
					trackColor={colors.borderContrastLow}
				/>
			)}
		</div>
	);
}

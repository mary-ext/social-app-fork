import { MAX_POST_GRAPHEME_LENGTH } from '#/lib/constants/composer';

import { ProgressCircle } from '#/components/ProgressCircle';
import { Text } from '#/components/Text';

import { colors } from '#/styles/colors';

import * as styles from './CharCount.css';

// show an exact count near the limit, where the ring is hard to read.
const COUNTDOWN_AT = 20;

/**
 * character progress with a remaining count near the limit; negative when over.
 *
 * @param props the post's grapheme count
 * @returns the character count indicator
 */
export function CharCount({ count }: { count: number }) {
	const remaining = MAX_POST_GRAPHEME_LENGTH - count;

	if (remaining < 0) {
		return (
			<Text className={styles.count} color="negative_500" size="md_sub" weight="semiBold">
				{remaining}
			</Text>
		);
	}

	return (
		<div className={styles.root}>
			{remaining <= COUNTDOWN_AT && (
				<Text className={styles.count} color="textContrastMedium" size="md_sub">
					{remaining}
				</Text>
			)}
			<ProgressCircle
				color={colors.primary_500}
				progress={count / MAX_POST_GRAPHEME_LENGTH}
				size={20}
				trackColor={colors.borderContrastLow}
			/>
		</div>
	);
}

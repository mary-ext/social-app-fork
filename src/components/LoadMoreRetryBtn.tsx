import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateCounterClockwiseIcon } from '#/components/icons/ArrowRotate';
import { Text } from '#/components/Text';

import { colors } from '#/styles/colors';

import * as css from './LoadMoreRetryBtn.css';

export function LoadMoreRetryBtn({ label, onPress }: { label: string; onPress: () => void }) {
	return (
		<button aria-label={label} className={css.button} onClick={onPress} type="button">
			<ArrowRotateCounterClockwiseIcon size="md" fill={colors.textContrastMedium} />
			<Text className={css.label} color="textContrastMedium">
				{label}
			</Text>
		</button>
	);
}

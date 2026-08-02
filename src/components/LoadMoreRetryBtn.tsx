import { Text } from '#/components/Text';

import ArrowRotateCounterClockwiseIcon from '#/icons/central/ArrowRotateCounterClockwise_round_outlined_radius1_stroke2.svg';

import * as css from './LoadMoreRetryBtn.css';

export function LoadMoreRetryBtn({ label, onPress }: { label: string; onPress: () => void }) {
	return (
		<button aria-label={label} className={css.button} onClick={onPress} type="button">
			<ArrowRotateCounterClockwiseIcon className={css.arrowRotateCounterClockwiseIcon} />
			<Text className={css.label} color="textContrastMedium">
				{label}
			</Text>
		</button>
	);
}

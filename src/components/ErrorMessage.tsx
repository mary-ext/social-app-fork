import { Text } from '#/components/Text';

import ArrowRotateClockwiseIcon from '#/icons/central/ArrowRotateClockwise_round_outlined_radius1_stroke2.svg';
import WarningIcon from '#/icons/central/ExclamationTriangle_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as css from './ErrorMessage.css';

export function ErrorMessage({
	message,
	onPressTryAgain,
}: {
	message: string;
	onPressTryAgain?: () => void;
}) {
	return (
		<div className={css.outer}>
			<div className={css.iconBox}>
				<WarningIcon className={css.icon} />
			</div>
			<Text className={css.message} size="md" weight="medium" color="white">
				{message}
			</Text>
			{onPressTryAgain && (
				<button
					aria-label={m['common.action.retry']()}
					className={css.retry}
					onClick={onPressTryAgain}
					type="button"
				>
					<ArrowRotateClockwiseIcon className={css.icon} />
				</button>
			)}
		</div>
	);
}

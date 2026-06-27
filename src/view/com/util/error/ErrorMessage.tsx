import { ArrowRotateClockwise_Stroke2_Corner0_Rounded as ArrowRotateClockwiseIcon } from '#/components/icons/ArrowRotate';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

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
				<WarningIcon width={18} fill={colors.white} />
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
					<ArrowRotateClockwiseIcon width={18} fill={colors.white} />
				</button>
			)}
		</div>
	);
}

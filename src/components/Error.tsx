import { useGoBack } from '#/lib/hooks/useGoBack';

import * as css from '#/components/Error.css';
import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

export function Error({
	hideBackButton,
	message,
	onGoBack,
	onRetry,
	title,
}: {
	hideBackButton?: boolean;
	message: string;
	onGoBack?: () => unknown;
	onRetry?: () => unknown;
	title: string;
}) {
	const goBack = useGoBack(onGoBack);

	return (
		<div className={css.outer}>
			<div className={css.textGroup}>
				<Text size="_3xl" weight="semiBold">
					{title}
				</Text>
				<Text align="center" className={css.message} color="textContrastHigh" size="md">
					{message}
				</Text>
			</div>
			<div className={css.buttonGroup}>
				{onRetry && (
					<Button
						color="primary"
						label={m['common.a11y.pressToRetry']()}
						onClick={() => void onRetry()}
						size="large"
						variant="solid"
					>
						<ButtonText>{m['common.action.retry']()}</ButtonText>
					</Button>
				)}
				{!hideBackButton && (
					<Button
						color={onRetry ? 'secondary' : 'primary'}
						label={m['common.action.returnToPreviousPage']()}
						onClick={goBack}
						size="large"
						variant="solid"
					>
						<ButtonText>{m['common.action.goBackTitle']()}</ButtonText>
					</Button>
				)}
			</div>
		</div>
	);
}

import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateCounterClockwiseIcon } from '#/components/icons/ArrowRotate';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import { Text } from '#/components/Text';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';

import * as css from './ErrorScreen.css';

export function ErrorScreen({
	title,
	message,
	details,
	onPressTryAgain,
	showHeader,
}: {
	title: string;
	message: string;
	details?: string;
	onPressTryAgain?: () => void;
	showHeader?: boolean;
}) {
	return (
		<>
			{showHeader && (
				<Layout.Header.Outer>
					<Layout.Header.BackButton />
					<Layout.Header.Content>
						<Layout.Header.TitleText>{m['common.error.heading']()}</Layout.Header.TitleText>
					</Layout.Header.Content>
				</Layout.Header.Outer>
			)}
			<div className={css.outer}>
				<div className={css.badge}>
					<WarningIcon size="xl" fill="currentColor" />
				</div>
				<Text className={css.title} size="_2xl" weight="bold">
					{title}
				</Text>
				<Text className={css.message} size="md">
					{message}
				</Text>
				{details && (
					<div className={css.details}>
						<Text color="textContrastHigh" size="md">
							{details}
						</Text>
					</div>
				)}
				{onPressTryAgain && (
					<Button
						color="secondary_inverted"
						label={m['common.action.retry']()}
						onClick={onPressTryAgain}
						size="small"
						variant="solid"
					>
						<ButtonIcon icon={ArrowRotateCounterClockwiseIcon} />
						<ButtonText>{m['common.action.tryAgain']()}</ButtonText>
					</Button>
				)}
			</div>
		</>
	);
}

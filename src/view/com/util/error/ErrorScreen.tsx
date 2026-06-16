import { Trans, useLingui } from '@lingui/react/macro';

import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateCounterClockwiseIcon } from '#/components/icons/ArrowRotate';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import * as Layout from '#/components/Layout';
import { Text } from '#/components/Text';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

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
	const { t: l } = useLingui();

	return (
		<>
			{showHeader && (
				<Layout.Header.Outer>
					<Layout.Header.BackButton />
					<Layout.Header.Content>
						<Layout.Header.TitleText>
							<Trans>Error</Trans>
						</Layout.Header.TitleText>
					</Layout.Header.Content>
					<Layout.Header.Slot />
				</Layout.Header.Outer>
			)}
			<div className={css.outer}>
				<div className={css.badge}>
					<WarningIcon width={24} fill="currentColor" />
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
						label={l`Retry`}
						onClick={onPressTryAgain}
						size="small"
						variant="solid"
					>
						<ButtonIcon icon={ArrowRotateCounterClockwiseIcon} />
						<ButtonText>
							<Trans context="action">Try again</Trans>
						</ButtonText>
					</Button>
				)}
			</div>
		</>
	);
}

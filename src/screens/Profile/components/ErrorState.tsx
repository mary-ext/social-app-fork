import { useGoBack } from '#/lib/hooks/useGoBack';

import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './ErrorState.css';

export function ErrorState({ error }: { error: string }) {
	const onPressBack = useGoBack();

	return (
		<div className={css.container}>
			<CircleInfo size="4xl" fill={colors.textContrastLow} />
			<Text className={css.title} size="xl" weight="semiBold">
				{m['screens.profile.labeler.error.serviceLoad']()}
			</Text>
			<Text className={css.description} size="md" color="textContrastMedium">
				{m['screens.profile.labeler.error.unavailable']()}
			</Text>

			<div className={css.errorBox}>
				<Text size="md">{error}</Text>
			</div>

			<div className={css.actions}>
				<Button
					size="small"
					color="secondary"
					variant="solid"
					label={m['common.action.goBackTitle']()}
					onClick={onPressBack}
				>
					<ButtonText>{m['common.action.goBackTitle']()}</ButtonText>
				</Button>
			</div>
		</div>
	);
}

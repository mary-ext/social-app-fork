import { useGoBack } from '#/lib/hooks/useGoBack';

import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as css from './ErrorScreen.css';

export function ErrorScreen({ error }: { error: React.ReactNode }) {
	const onPressBack = useGoBack();

	return (
		<div className={css.outer}>
			<Text size="_4xl" weight="bold">
				{m['screens.profileList.error.loadFailed']()}
			</Text>
			<Text color="textContrastHigh" leading="snug" size="md">
				{error}
			</Text>
			<div className={css.actionRow}>
				<Button color="secondary" label={m['common.action.goBack']()} onClick={onPressBack} size="small">
					<ButtonText>{m['common.action.goBack']()}</ButtonText>
				</Button>
			</div>
		</div>
	);
}

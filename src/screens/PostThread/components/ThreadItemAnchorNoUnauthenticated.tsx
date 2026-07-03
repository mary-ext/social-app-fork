import { LINEAR_AVI_WIDTH } from '#/screens/PostThread/const';

import { Lock_Stroke2_Corner0_Rounded as LockIcon } from '#/components/icons/Lock';
import { Text } from '#/components/Text';
import * as Skele from '#/components/web/Skeleton';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './ThreadItemAnchorNoUnauthenticated.css';

export function ThreadItemAnchorNoUnauthenticated() {
	return (
		<Skele.Col className={css.container} gap="md">
			<Skele.Row align="center" gap="md">
				<Skele.Circle size={LINEAR_AVI_WIDTH}>
					<LockIcon size="lg" fill={colors.textContrastMedium} />
				</Skele.Circle>

				<Skele.Text size="lg" width="20%" />
			</Skele.Row>

			<Text className={css.text} color="textContrastMedium" size="lg">
				{m['screens.postThread.visibility.signedInOnly']()}
			</Text>
		</Skele.Col>
	);
}

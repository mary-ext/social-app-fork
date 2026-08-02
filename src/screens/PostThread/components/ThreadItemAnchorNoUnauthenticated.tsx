import { LINEAR_AVI_WIDTH } from '#/screens/PostThread/const';

import { Text } from '#/components/Text';
import * as Skele from '#/components/web/Skeleton';

import LockIcon from '#/icons/central/Lock_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as css from './ThreadItemAnchorNoUnauthenticated.css';

export function ThreadItemAnchorNoUnauthenticated() {
	return (
		<Skele.Col className={css.container} gap="md">
			<Skele.Row align="center" gap="md">
				<Skele.Circle size={LINEAR_AVI_WIDTH}>
					<LockIcon className={css.lockIcon} />
				</Skele.Circle>

				<Skele.Text size="lg" width="20%" />
			</Skele.Row>
			<Text className={css.text} color="textContrastMedium" size="lg">
				{m['screens.postThread.visibility.signedInOnly']()}
			</Text>
		</Skele.Col>
	);
}

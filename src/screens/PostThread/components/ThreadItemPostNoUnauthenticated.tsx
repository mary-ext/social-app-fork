import type { ThreadItem } from '#/state/queries/usePostThread/types';

import { LINEAR_AVI_WIDTH } from '#/screens/PostThread/const';

import { Lock_Stroke2_Corner0_Rounded as LockIcon } from '#/components/icons/Lock';
import * as PostLayout from '#/components/PostLayout';
import { Text } from '#/components/Text';
import * as Skele from '#/components/web/Skeleton';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './ThreadItemPostNoUnauthenticated.css';

export function ThreadItemPostNoUnauthenticated({
	item,
}: {
	item: Extract<ThreadItem, { type: 'threadPostNoUnauthenticated' }>;
}) {
	return (
		<div className={css.container}>
			<div className={css.parentSpineRow}>
				<div className={css.parentSpineColumn}>
					{item.ui.showParentReplyLine && <PostLayout.Spine className={css.parentSpine} />}
				</div>
			</div>
			<PostLayout.Row>
				<PostLayout.AvatarColumn>
					<Skele.Circle size={LINEAR_AVI_WIDTH}>
						<LockIcon size="lg" fill={colors.textContrastMedium} />
					</Skele.Circle>

					{item.ui.showChildReplyLine && <PostLayout.Spine className={css.childSpine} />}
				</PostLayout.AvatarColumn>

				<PostLayout.ContentColumn>
					<Text className={css.text} color="textContrastMedium" size="md">
						{m['screens.postThread.visibility.signedInOnly']()}
					</Text>
				</PostLayout.ContentColumn>
			</PostLayout.Row>
		</div>
	);
}

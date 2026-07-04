import type { ThreadItem } from '#/state/queries/usePostThread';

import { ArrowTopCircle_Stroke2_Corner0_Rounded as UpIcon } from '#/components/icons/ArrowTopCircle';
import * as PostLayout from '#/components/PostLayout';
import { Text } from '#/components/Text';
import { Link } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import * as css from './ThreadItemReadMoreUp.css';

export function ThreadItemReadMoreUp({ item }: { item: Extract<ThreadItem, { type: 'readMoreUp' }> }) {
	return (
		<Link className={css.link} label={m['screens.postThread.reply.action.continueThread']()} to={item.href}>
			<PostLayout.Row className={css.rowTop}>
				<PostLayout.AvatarColumn className={css.iconColumn}>
					<UpIcon className={css.icon} fill="currentColor" size="lg" />
				</PostLayout.AvatarColumn>
				<Text className={css.text} size="md_sub" color="textContrastMedium">
					{m['screens.postThread.reply.action.continueThreadMore']()}
				</Text>
			</PostLayout.Row>
			<PostLayout.AvatarColumn className={css.iconColumn}>
				<div className={css.lineStub} />
			</PostLayout.AvatarColumn>
		</Link>
	);
}

import type { ThreadItem } from '#/state/queries/usePostThread';

import * as PostLayout from '#/components/PostLayout';
import { Text } from '#/components/Text';
import { Link } from '#/components/web/Link';

import UpIcon from '#/icons/central/ArrowUpCircle_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as css from './ThreadItemReadMoreUp.css';

export function ThreadItemReadMoreUp({ item }: { item: Extract<ThreadItem, { type: 'readMoreUp' }> }) {
	return (
		<Link className={css.link} label={m['screens.postThread.reply.action.continueThread']()} to={item.target}>
			<PostLayout.Row className={css.rowTop}>
				<PostLayout.AvatarColumn className={css.iconColumn}>
					<UpIcon className={css.icon} />
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

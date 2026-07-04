import { clsx } from 'clsx';

import type { PostThreadParams, ThreadItem } from '#/state/queries/usePostThread';

import { CirclePlus_Stroke2_Corner0_Rounded as CirclePlus } from '#/components/icons/CirclePlus';
import { Text } from '#/components/Text';
import { Link } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import * as css from './ThreadItemReadMore.css';
import { IndentGuides } from './ThreadLines';

export function ThreadItemReadMore({
	item,
	view,
}: {
	item: Extract<ThreadItem, { type: 'readMore' }>;
	view: PostThreadParams['view'];
}) {
	const isTreeView = view === 'tree';
	const indent = Math.max(0, item.depth - 1);

	return (
		<div className={css.outer}>
			{isTreeView && <IndentGuides count={indent} keyPrefix={item.key} skipped={item.skippedIndentIndices} />}
			<div className={clsx(css.connectorBase, isTreeView ? css.connectorTree : css.connectorLinear)} />
			<Link className={css.link} label={m['screens.postThread.reply.action.readMore']()} to={item.href}>
				<CirclePlus className={css.icon} fill="currentColor" size="md" />
				<Text className={css.text} color="textContrastMedium" size="sm">
					{m['screens.postThread.reply.action.readMoreCount']({ count: item.moreReplies })}
				</Text>
			</Link>
		</div>
	);
}

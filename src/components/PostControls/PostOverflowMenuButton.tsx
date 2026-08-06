import type { AppBskyFeedDefs, AppBskyFeedPost, AppBskyFeedThreadgate } from '@atcute/bluesky';

import type { Richtext } from '#/lib/rich-text';

import type { Shadow } from '#/state/cache/post-shadow';

import DotsHorizontal from '#/icons/central/DotGrid1x3Horizontal_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as css from './index.css';
import { PostOverflowMenu } from './PostMenu';

type Props = {
	feedContext?: string | undefined;
	onShowLess?: (interaction: AppBskyFeedDefs.Interaction) => void;
	post: Shadow<AppBskyFeedDefs.PostView>;
	record: AppBskyFeedPost.Main;
	reqId?: string | undefined;
	richText: Richtext;
	threadgateRecord?: AppBskyFeedThreadgate.Main;
};

/**
 * post overflow ("…") menu rendered as a standalone corner button, for surfaces that pin it to the post's
 * top-right rather than the trailing action bar. reuses the compact {@link PostControls} button chrome.
 */
export function PostOverflowMenuButton({
	feedContext,
	onShowLess,
	post,
	record,
	reqId,
	richText,
	threadgateRecord,
}: Props) {
	return (
		<PostOverflowMenu
			post={post}
			postFeedContext={feedContext}
			postReqId={reqId}
			record={record}
			richText={richText}
			threadgateRecord={threadgateRecord}
			onShowLess={onShowLess}
			tooltip={m['components.postControls.options.more']()}
			render={
				<button type="button" aria-label={m['components.postControls.options.a11y']()} className={css.button}>
					<span className={css.iconCircle}>
						<DotsHorizontal className={css.icon} />
					</span>
				</button>
			}
		/>
	);
}

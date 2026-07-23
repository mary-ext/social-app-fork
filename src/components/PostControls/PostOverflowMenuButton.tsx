import type { AppBskyFeedDefs, AppBskyFeedPost, AppBskyFeedThreadgate } from '@atcute/bluesky';

import type { Richtext } from '#/lib/strings/rich-text-facets';

import type { Shadow } from '#/state/cache/post-shadow';

import { DotGrid3x1_Stroke2_Corner0_Rounded as DotsHorizontal } from '#/components/icons/DotGrid';

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
						<DotsHorizontal size="md" fill="currentColor" className={css.pointerEventsNone} />
					</span>
				</button>
			}
		/>
	);
}

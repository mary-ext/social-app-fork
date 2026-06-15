import { memo, useState } from 'react';
import type { AppBskyFeedDefs, AppBskyFeedPost, AppBskyFeedThreadgate } from '@atcute/bluesky';
import { useLingui } from '@lingui/react/macro';

import type { Richtext } from '#/lib/strings/rich-text-facets';

import type { Shadow } from '#/state/cache/post-shadow';

import { DotGrid3x1_Stroke2_Corner0_Rounded as DotsHorizontal } from '#/components/icons/DotGrid';
import * as Menu from '#/components/web/Menu';

import { PostControlButton, PostControlButtonIcon } from '../PostControlButton';
import { PostMenuItems } from './PostMenuItems';

let PostMenuButton = ({
	post,
	postFeedContext,
	postReqId,
	big,
	record,
	richText,
	threadgateRecord,
	onShowLess,
	logContext,
}: {
	post: Shadow<AppBskyFeedDefs.PostView>;
	postFeedContext: string | undefined;
	postReqId: string | undefined;
	big?: boolean;
	record: AppBskyFeedPost.Main;
	richText: Richtext;
	threadgateRecord?: AppBskyFeedThreadgate.Main;
	onShowLess?: (interaction: AppBskyFeedDefs.Interaction) => void;
	logContext: 'FeedItem' | 'PostThreadItem' | 'Post';
}): React.ReactNode => {
	const { t: l } = useLingui();
	// the items run a stack of hooks; only mount them once the menu has been opened.
	const [hasBeenOpen, setHasBeenOpen] = useState(false);

	return (
		<Menu.Root
			onOpenChange={(open) => {
				if (open) {
					setHasBeenOpen(true);
				}
			}}
		>
			<Menu.Trigger
				render={
					<PostControlButton label={l`Open post options menu`} tooltip={l`More`} big={big}>
						<PostControlButtonIcon icon={DotsHorizontal} />
					</PostControlButton>
				}
			/>
			{hasBeenOpen && (
				<PostMenuItems
					post={post}
					postFeedContext={postFeedContext}
					postReqId={postReqId}
					record={record}
					richText={richText}
					threadgateRecord={threadgateRecord}
					onShowLess={onShowLess}
					logContext={logContext}
				/>
			)}
		</Menu.Root>
	);
};

PostMenuButton = memo(PostMenuButton);
export { PostMenuButton };

import { type ReactElement, useState } from 'react';

import type { AppBskyFeedDefs, AppBskyFeedPost, AppBskyFeedThreadgate } from '@atcute/bluesky';

import type { Richtext } from '#/lib/strings/rich-text-facets';

import type { Shadow } from '#/state/cache/post-shadow';

import * as Menu from '#/components/Menu';
import { Tooltip } from '#/components/Tooltip';

import { PostMenuItems } from './PostMenuItems';

/**
 * The post overflow menu. The caller supplies the trigger button via `render` so each action-bar size owns
 * its own button chrome.
 */
export const PostOverflowMenu = ({
	render,
	tooltip,
	post,
	postFeedContext,
	postReqId,
	record,
	richText,
	threadgateRecord,
	onShowLess,
}: {
	render: ReactElement;
	/** Hover/focus hint for the trigger; the tooltip wraps the menu trigger so it survives the menu wiring. */
	tooltip: string;
	post: Shadow<AppBskyFeedDefs.PostView>;
	postFeedContext: string | undefined;
	postReqId: string | undefined;
	record: AppBskyFeedPost.Main;
	richText: Richtext;
	threadgateRecord?: AppBskyFeedThreadgate.Main;
	onShowLess?: (interaction: AppBskyFeedDefs.Interaction) => void;
}): React.ReactNode => {
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
			<Tooltip label={tooltip}>
				<Menu.Trigger render={render} />
			</Tooltip>
			{hasBeenOpen && (
				<PostMenuItems
					post={post}
					postFeedContext={postFeedContext}
					postReqId={postReqId}
					record={record}
					richText={richText}
					threadgateRecord={threadgateRecord}
					onShowLess={onShowLess}
				/>
			)}
		</Menu.Root>
	);
};

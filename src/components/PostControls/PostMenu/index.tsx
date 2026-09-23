import { lazy, type ReactElement, type ReactNode, Suspense, useState } from 'react';

import type { AppBskyFeedDefs, AppBskyFeedPost, AppBskyFeedThreadgate } from '@atcute/bluesky';

import type { Richtext } from '#/lib/rich-text';

import type { Shadow } from '#/state/cache/post-shadow';

import * as Menu from '#/components/Menu';
import { Tooltip } from '#/components/Tooltip';

const importPostMenuItems = () => import('./PostMenuItems').then((mod) => ({ default: mod.PostMenuItems }));

const PostMenuItems = lazy(importPostMenuItems);

/**
 * The post overflow menu. The caller supplies the trigger button via `render` so each action-bar size owns
 * its own button chrome.
 */
export const PostOverflowMenu = ({
	render,
	tooltip,
	alwaysShowTranslate,
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
	/** bypass the language check when offering translation. */
	alwaysShowTranslate?: boolean;
	post: Shadow<AppBskyFeedDefs.PostView>;
	postFeedContext: string | undefined;
	postReqId: string | undefined;
	record: AppBskyFeedPost.Main;
	richText: Richtext;
	threadgateRecord?: AppBskyFeedThreadgate.Main;
	onShowLess?: (interaction: AppBskyFeedDefs.Interaction) => void;
}): ReactNode => {
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
				<Menu.Trigger
					render={render}
					onFocus={() => void importPostMenuItems()}
					onPointerEnter={() => void importPostMenuItems()}
				/>
			</Tooltip>
			{hasBeenOpen && (
				<Suspense fallback={null}>
					<PostMenuItems
						alwaysShowTranslate={alwaysShowTranslate}
						post={post}
						postFeedContext={postFeedContext}
						postReqId={postReqId}
						record={record}
						richText={richText}
						threadgateRecord={threadgateRecord}
						onShowLess={onShowLess}
					/>
				</Suspense>
			)}
		</Menu.Root>
	);
};

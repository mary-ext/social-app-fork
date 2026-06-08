import { memo, useState } from 'react';
import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { useLingui } from '@lingui/react/macro';

import type { Shadow } from '#/state/cache/post-shadow';

import { ArrowShareRight_Stroke2_Corner2_Rounded as ArrowShareRightIcon } from '#/components/icons/ArrowShareRight';
import * as Menu from '#/components/web/Menu';

import { PostControlButton, PostControlButtonIcon } from '../PostControlButton';
import { ShareMenuItems } from './ShareMenuItems';

let ShareMenuButton = ({
	post,
	big,
	onShare,
}: {
	post: Shadow<AppBskyFeedDefs.PostView>;
	big?: boolean;
	onShare: () => void;
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
					<PostControlButton label={l`Open share menu`} big={big}>
						<PostControlButtonIcon icon={ArrowShareRightIcon} />
					</PostControlButton>
				}
			/>
			{hasBeenOpen && <ShareMenuItems post={post} onShare={onShare} />}
		</Menu.Root>
	);
};

ShareMenuButton = memo(ShareMenuButton);
export { ShareMenuButton };

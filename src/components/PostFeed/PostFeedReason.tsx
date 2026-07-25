import type { AppBskyFeedDefs } from '@atcute/bluesky';

import { makeProfileLink } from '#/lib/routes/links';

import { useSession } from '#/state/session';

import { Pin_Stroke2_Corner0_Rounded as PinIcon } from '#/components/icons/Pin';
import { Repost_Stroke2_Corner3_Rounded as RepostIcon } from '#/components/icons/Repost';
import { ProfileHoverCard } from '#/components/ProfileHoverCard';
import { Text } from '#/components/Text';
import { InlineLinkText } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import * as css from './PostFeedReason.css';

// every reason line shares one look: low-contrast, medium-weight, clamped to a single line.
const reasonText = {
	color: 'textContrastMedium',
	size: 'md_sub',
	numberOfLines: 1,
	weight: 'medium',
} as const;

export function PostFeedReason({
	reason,
	onOpenReposter,
}: {
	reason: AppBskyFeedDefs.ReasonRepost | AppBskyFeedDefs.ReasonPin;
	onOpenReposter?: () => void;
}) {
	const { currentAccount } = useSession();

	if (reason.$type === 'app.bsky.feed.defs#reasonRepost') {
		const by = reason.by;
		const isOwner = by.did === currentAccount?.did;
		const reposter = by.handle;
		return (
			<div className={css.includeReason}>
				<RepostIcon fill="currentColor" width={13} height={13} />
				<ProfileHoverCard did={by.did}>
					<InlineLinkText
						{...reasonText}
						onPress={onOpenReposter}
						to={makeProfileLink(by)}
						label={isOwner ? m['view.posts.repost.byYou']() : m['view.posts.repost.by']({ reposter })}
					>
						{isOwner ? m['view.posts.repost.byYou']() : m['view.posts.repost.by']({ reposter })}
					</InlineLinkText>
				</ProfileHoverCard>
			</div>
		);
	}

	if (reason.$type === 'app.bsky.feed.defs#reasonPin') {
		return (
			<div className={css.includeReason}>
				<PinIcon fill="currentColor" width={13} height={13} />
				<Text {...reasonText}>{m['view.posts.feed.pinnedBadge']()}</Text>
			</div>
		);
	}
}

import type { AppBskyFeedDefs } from '@atcute/bluesky';

import { profileTarget } from '#/lib/routes/targets';

import { useSession } from '#/state/session';

import { ProfileHoverCard } from '#/components/ProfileHoverCard';
import { Text } from '#/components/Text';
import { InlineLinkText } from '#/components/web/Link';

import RepostIcon from '#/icons/central/ArrowsRepeatRightLeft_round_outlined_radius1_stroke2.svg';
import PinIcon from '#/icons/central/Thumbtack_round_outlined_radius1_stroke2.svg';
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
				<RepostIcon className={css.reasonIcon} />
				<ProfileHoverCard actor={by.did}>
					<InlineLinkText
						{...reasonText}
						onPress={onOpenReposter}
						to={profileTarget(by.did)}
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
				<PinIcon className={css.reasonIcon} />
				<Text {...reasonText}>{m['view.posts.feed.pinnedBadge']()}</Text>
			</div>
		);
	}
}

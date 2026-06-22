import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';

import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeHandle } from '#/lib/strings/handles';

import { useSession } from '#/state/session';

import { Pin_Stroke2_Corner0_Rounded as PinIcon } from '#/components/icons/Pin';
import { Repost_Stroke2_Corner3_Rounded as RepostIcon } from '#/components/icons/Repost';
import { Text } from '#/components/Text';
import { InlineLinkText } from '#/components/web/Link';
import { ProfileHoverCard } from '#/components/web/ProfileHoverCard';

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
	const { t: l } = useLingui();

	const { currentAccount } = useSession();

	if (reason.$type === 'app.bsky.feed.defs#reasonRepost') {
		const by = reason.by;
		const isOwner = by.did === currentAccount?.did;
		const reposter = sanitizeHandle(by.handle);
		return (
			<div className={css.includeReason}>
				<RepostIcon fill="currentColor" width={13} height={13} />
				<ProfileHoverCard did={by.did}>
					<InlineLinkText
						{...reasonText}
						onPress={onOpenReposter}
						to={makeProfileLink(by)}
						label={isOwner ? l`Reposted by you` : l`Reposted by ${reposter}`}
					>
						{isOwner ? <Trans>Reposted by you</Trans> : <Trans>Reposted by {reposter}</Trans>}
					</InlineLinkText>
				</ProfileHoverCard>
			</div>
		);
	}

	if (reason.$type === 'app.bsky.feed.defs#reasonPin') {
		return (
			<div className={css.includeReason}>
				<PinIcon fill="currentColor" width={13} height={13} />
				<Text {...reasonText}>
					<Trans>Pinned</Trans>
				</Text>
			</div>
		);
	}
}

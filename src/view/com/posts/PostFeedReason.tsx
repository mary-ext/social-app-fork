import { StyleSheet, View } from 'react-native';
import type { AnyProfileView, AppBskyFeedDefs } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, type ModerationDecision } from '@atcute/bluesky-moderation';
import { useLingui, Trans } from '@lingui/react/macro';

import { isReasonFeedSource, type ReasonFeedSource } from '#/lib/api/feed/types';
import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';
import { makeProfileLink } from '#/lib/routes/links';

import { useSession } from '#/state/session';

import { atoms as a, useTheme } from '#/alf';

import { Pin_Stroke2_Corner0_Rounded as PinIcon } from '#/components/icons/Pin';
import { Repost_Stroke2_Corner3_Rounded as RepostIcon } from '#/components/icons/Repost';
import { Link } from '#/components/Link';
import { ProfileHoverCard } from '#/components/ProfileHoverCard';
import { Text } from '#/components/Typography';

import { FeedNameText } from '../util/FeedInfoText';

export function PostFeedReason({
	reason,
	moderation,
	onOpenReposter,
}: {
	reason: ReasonFeedSource | AppBskyFeedDefs.ReasonRepost | AppBskyFeedDefs.ReasonPin;
	moderation?: ModerationDecision;
	onOpenReposter?: () => void;
}) {
	const t = useTheme();
	const { t: l } = useLingui();

	const { currentAccount } = useSession();

	if (isReasonFeedSource(reason)) {
		return (
			<Link label={l`Go to feed`} to={reason.href}>
				<Text
					style={[t.atoms.text_contrast_medium, a.font_medium, a.leading_snug, a.leading_snug]}
					numberOfLines={1}
				>
					<Trans context="from-feed">
						From{' '}
						<FeedNameText
							uri={reason.uri}
							href={reason.href}
							style={[t.atoms.text_contrast_medium, a.font_medium, a.leading_snug]}
							numberOfLines={1}
						/>
					</Trans>
				</Text>
			</Link>
		);
	}

	if (reason?.$type === 'app.bsky.feed.defs#reasonRepost') {
		const by = reason.by;
		const isOwner = by.did === currentAccount?.did;
		const reposter = createSanitizedDisplayName(
			by as AnyProfileView,
			false,
			moderation && getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
		);
		return (
			<Link
				style={styles.includeReason}
				to={makeProfileLink(by)}
				label={isOwner ? l`Reposted by you` : l`Reposted by ${reposter}`}
				onPress={onOpenReposter}
			>
				<RepostIcon style={[t.atoms.text_contrast_medium, { marginRight: 3 }]} width={13} height={13} />
				<ProfileHoverCard did={by.did}>
					<Text style={[t.atoms.text_contrast_medium, a.font_medium, a.leading_snug]} numberOfLines={1}>
						{isOwner ? <Trans>Reposted by you</Trans> : <Trans>Reposted by {reposter}</Trans>}
					</Text>
				</ProfileHoverCard>
			</Link>
		);
	}

	if (reason?.$type === 'app.bsky.feed.defs#reasonPin') {
		return (
			<View style={styles.includeReason}>
				<PinIcon style={[t.atoms.text_contrast_medium, { marginRight: 3 }]} width={13} height={13} />
				<Text style={[t.atoms.text_contrast_medium, a.font_medium, a.leading_snug]} numberOfLines={1}>
					<Trans>Pinned</Trans>
				</Text>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	includeReason: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 2,
		marginLeft: -16,
	},
});

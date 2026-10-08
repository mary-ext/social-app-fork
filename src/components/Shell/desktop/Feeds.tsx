import { getLocalizedFeedName } from '#/lib/feed-names';

import { softReset } from '#/state/events';
import { setSelectedFeed, useSelectedFeed } from '#/state/preferences/selected-feed';
import { type SavedFeedSourceInfo, usePinnedFeedsInfos } from '#/state/queries/feed';

import * as Toggle from '#/components/primitives/toggle';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { Link } from '#/components/web/Link';
import * as Skeleton from '#/components/web/Skeleton';

import FilterTimeline from '#/icons/central/FilterTimeline_round_outlined_radius1_stroke2.svg';
import Plus from '#/icons/central/PlusSmall_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useRouter, useTarget } from '#/router';

import * as css from './Feeds.css';

const MORE_FEEDS = 'more-feeds';

export function DesktopFeeds() {
	const { data: pinnedFeedInfos, error, isLoading } = usePinnedFeedsInfos();
	const selectedFeed = useSelectedFeed();
	const router = useRouter();
	const target = useTarget();

	if (isLoading) {
		return (
			<div className={css.skeleton}>
				{Array.from({ length: 5 }, (_, i) => (
					<Skeleton.Row key={i} align="center" gap="sm" className={css.skeletonRow}>
						<Skeleton.Square size={20} />
						<Skeleton.Text size="md" width={i % 2 === 0 ? 110 : 80} />
					</Skeleton.Row>
				))}
			</div>
		);
	}

	if (error || !pinnedFeedInfos) {
		return null;
	}

	// the active feed is selected only on Home; with no explicit selection the first pinned feed leads. on the
	// Feeds screen the sentinel "More feeds" entry is the selected one instead.
	const activeFeed = target.name === 'Home' ? (selectedFeed ?? pinnedFeedInfos[0]?.uri) : undefined;
	const activeValue = activeFeed ?? (target.name === 'Feeds' ? MORE_FEEDS : undefined);

	const onValueChange = (next: string[]) => {
		// an empty selection reselects the active feed; "More feeds" navigates through its link.
		const nextValue = next[0];
		const feed = nextValue ? pinnedFeedInfos.find((info) => info.uri === nextValue)?.uri : activeFeed;
		if (!feed) {
			return;
		}
		const reselectedActive = next.length === 0;

		window.scrollTo(0, 0);

		setSelectedFeed(feed);
		router.navigate({ to: { name: 'Home' } });

		if (reselectedActive && feed === selectedFeed) {
			softReset.emit();
		}
	};

	return (
		<Toggle.Group
			className={css.group}
			orientation="vertical"
			value={activeValue ? [activeValue] : []}
			onValueChange={onValueChange}
		>
			{pinnedFeedInfos.map((feedInfo) => (
				<FeedItem key={feedInfo.uri} feedInfo={feedInfo} />
			))}
			<Toggle.Root
				value={MORE_FEEDS}
				nativeButton={false}
				render={
					<Link to={{ name: 'Feeds' }} label={m['view.feeds.feed.more']()} className={css.item}>
						<span className={css.morePlusBox}>
							<Plus className={css.plusIcon} />
						</span>
						<Text size="md" numberOfLines={1} className={css.label}>
							{m['view.feeds.feed.more']()}
						</Text>
					</Link>
				}
			/>
		</Toggle.Group>
	);
}

function FeedItem({ feedInfo }: { feedInfo: SavedFeedSourceInfo }) {
	const isFollowing = feedInfo.feedDescriptor.type === 'following';
	const displayName = getLocalizedFeedName(feedInfo);

	return (
		<Toggle.Root
			value={feedInfo.uri}
			className={css.item}
			aria-label={displayName}
			title={m['view.feeds.feed.a11y.opens']({ name: displayName })}
		>
			{isFollowing ? (
				<span className={css.followingIcon}>
					<FilterTimeline className={css.filterTimelineIcon} />
				</span>
			) : (
				<UserAvatar
					type={feedInfo.type === 'list' ? 'list' : 'algo'}
					size={20}
					avatar={feedInfo.avatar}
					noBorder
					className={css.avatar}
				/>
			)}
			<Text size="md" numberOfLines={1} className={css.label}>
				{displayName}
			</Text>
		</Toggle.Root>
	);
}

import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { useNavigation, useNavigationState } from '@react-navigation/native';

import { getCurrentRoute } from '#/lib/routes/helpers';
import type { NavigationProp } from '#/lib/routes/types';

import { softReset } from '#/state/events';
import { type SavedFeedSourceInfo, usePinnedFeedsInfos } from '#/state/queries/feed';
import type { FeedDescriptor } from '#/state/queries/post-feed';
import { useSelectedFeed, useSetSelectedFeed } from '#/state/shell/selected-feed';

import { FilterTimeline_Stroke2_Corner0_Rounded as FilterTimeline } from '#/components/icons/FilterTimeline';
import { PlusSmall_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { Link } from '#/components/web/Link';
import * as Skeleton from '#/components/web/Skeleton';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './Feeds.css';

// sentinel group value for the "More feeds" entry — a route path, never a real feed descriptor.
const MORE_FEEDS = '/feeds';

export function DesktopFeeds() {
	const { data: pinnedFeedInfos, error, isLoading } = usePinnedFeedsInfos();
	const selectedFeed = useSelectedFeed();
	const setSelectedFeed = useSetSelectedFeed();
	const navigation = useNavigation<NavigationProp>();
	const route = useNavigationState((state) => {
		if (!state) {
			return { name: 'Home' };
		}
		return getCurrentRoute(state);
	});

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
	const activeFeed = route.name === 'Home' ? (selectedFeed ?? pinnedFeedInfos[0]?.feedDescriptor) : undefined;
	const activeValue = activeFeed ?? (route.name === 'Feeds' ? MORE_FEEDS : undefined);

	const onValueChange = (next: string[]) => {
		// More feeds is an <a> that navigates itself, so it never reports here. single-select: clicking another
		// feed yields `[feed]`, re-clicking the active one yields `[]`.
		const feed = (next[0] ?? activeFeed) as FeedDescriptor | undefined;
		if (!feed) {
			return;
		}
		const reselectedActive = next.length === 0;
		setSelectedFeed(feed);
		navigation.navigate('Home');
		if (reselectedActive && feed === selectedFeed) {
			softReset.emit();
		}
	};

	return (
		<ToggleGroup
			className={css.group}
			orientation="vertical"
			value={activeValue ? [activeValue] : []}
			onValueChange={onValueChange}
		>
			{pinnedFeedInfos.map((feedInfo) => (
				<FeedItem key={feedInfo.uri} feedInfo={feedInfo} />
			))}
			<Toggle
				value={MORE_FEEDS}
				nativeButton={false}
				render={
					<Link to={MORE_FEEDS} label={m['view.feeds.feed.more']()} className={css.item}>
						<span className={css.morePlusBox}>
							<Plus size="sm" fill="currentColor" />
						</span>
						<Text size="md" numberOfLines={1} className={css.label}>
							{m['view.feeds.feed.more']()}
						</Text>
					</Link>
				}
			/>
		</ToggleGroup>
	);
}

function FeedItem({ feedInfo }: { feedInfo: SavedFeedSourceInfo }) {
	const isFollowing = feedInfo.feedDescriptor === 'following';

	return (
		<Toggle
			value={feedInfo.feedDescriptor}
			className={css.item}
			aria-label={feedInfo.displayName}
			title={m['view.feeds.feed.a11y.opens']({ name: feedInfo.displayName })}
		>
			{isFollowing ? (
				<span className={css.followingIcon}>
					<FilterTimeline width={14} height={14} fill={colors.white} />
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
				{feedInfo.displayName}
			</Text>
		</Toggle>
	);
}

import { type StyleProp, View, type ViewStyle } from 'react-native';

import type { AppBskyFeedDefs, AppBskyGraphDefs } from '@atcute/bluesky';
import type { $type } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import {
	type FeedSourceInfo,
	hydrateFeedGenerator,
	hydrateList,
	useFeedSourceInfoQuery,
} from '#/state/queries/feed';

import { FeedLoadingPlaceholder } from '#/view/com/util/LoadingPlaceholder';

import { atoms as a, useTheme } from '#/alf';

import { Link } from '#/components/Link';
import { Text } from '#/components/Typography';
import { UserAvatar } from '#/components/UserAvatar';

import { m } from '#/paraglide/messages';

import { MissingFeed } from './MissingFeed';

type FeedSourceCardProps = {
	feedUri: string;
	feedData?: $type.enforce<AppBskyFeedDefs.GeneratorView> | $type.enforce<AppBskyGraphDefs.ListView>;
	style?: StyleProp<ViewStyle>;
	showLikes?: boolean;
	showMinimalPlaceholder?: boolean;
	hideTopBorder?: boolean;
	link?: boolean;
};

export function FeedSourceCard({ feedUri, feedData, ...props }: FeedSourceCardProps) {
	if (feedData) {
		let feed: FeedSourceInfo;
		if (feedData.$type === 'app.bsky.feed.defs#generatorView') {
			feed = hydrateFeedGenerator(feedData);
		} else {
			feed = hydrateList(feedData);
		}
		return <FeedSourceCardLoaded feedUri={feedUri} feed={feed} {...props} />;
	} else {
		return <FeedSourceCardWithoutData feedUri={feedUri} {...props} />;
	}
}

export function FeedSourceCardWithoutData({ feedUri, ...props }: Omit<FeedSourceCardProps, 'feedData'>) {
	const { data: feed, error } = useFeedSourceInfoQuery({
		uri: feedUri,
	});

	return <FeedSourceCardLoaded feedUri={feedUri} feed={feed} error={error} {...props} />;
}

export function FeedSourceCardLoaded({
	feedUri,
	feed,
	style,
	showLikes = false,
	showMinimalPlaceholder,
	hideTopBorder,
	link = true,
	error,
}: {
	feedUri: string;
	feed?: FeedSourceInfo;
	style?: StyleProp<ViewStyle>;
	showLikes?: boolean;
	showMinimalPlaceholder?: boolean;
	hideTopBorder?: boolean;
	link?: boolean;
	error?: unknown;
}) {
	const t = useTheme();
	/*
	 * LOAD STATE
	 *
	 * This state also captures the scenario where a feed can't load for whatever
	 * reason.
	 */
	if (!feed) {
		if (error) {
			return <MissingFeed uri={feedUri} style={style} hideTopBorder={hideTopBorder} error={error} />;
		}

		return (
			<FeedLoadingPlaceholder
				style={[
					t.atoms.border_contrast_low,
					!(showMinimalPlaceholder || hideTopBorder) && a.border_t,
					a.flex_1,
					style,
				]}
				showTopBorder={false}
				showLowerPlaceholder={!showMinimalPlaceholder}
			/>
		);
	}

	const inner = (
		<>
			<View style={[a.flex_row, a.align_center]}>
				<View style={[a.mr_md]}>
					<UserAvatar type="algo" size={36} avatar={feed.avatar} />
				</View>
				<View style={[a.flex_1]}>
					<Text emoji style={[a.text_sm, a.font_semi_bold, a.leading_snug]} numberOfLines={1}>
						{feed.displayName}
					</Text>
					<Text style={[a.text_sm, t.atoms.text_contrast_medium, a.leading_snug]} numberOfLines={1}>
						{feed.type === 'feed'
							? m['common.feeds.feedBy']({ handle: feed.creatorHandle })
							: m['common.list.byCreator']({ handle: feed.creatorHandle })}
					</Text>
				</View>
			</View>
			{showLikes && feed.type === 'feed' ? (
				<Text style={[a.text_sm, a.font_semi_bold, t.atoms.text_contrast_medium, a.leading_snug]}>
					{m['common.like.likedByCount']({ count: feed.likeCount || 0 })}
				</Text>
			) : null}
		</>
	);

	if (link) {
		return (
			<Link
				testID={`feed-${feed.displayName}`}
				label={
					feed.type === 'feed'
						? m['view.feeds.feed.a11y.label']({
								name: feed.displayName,
								creator: feed.creatorHandle,
								count: feed.likeCount || 0,
							})
						: m['view.feeds.list.a11y.label']({
								name: feed.displayName,
								creator: feed.creatorHandle,
							})
				}
				to={{
					screen: feed.type === 'feed' ? 'ProfileFeed' : 'ProfileList',
					params: { name: feed.creatorDid, rkey: parseCanonicalResourceUri(feed.uri).rkey },
				}}
				style={[a.flex_1, a.p_lg, a.gap_md, !hideTopBorder && a.border_t, t.atoms.border_contrast_low, style]}
			>
				{inner}
			</Link>
		);
	} else {
		return (
			<View
				style={[a.flex_1, a.p_lg, a.gap_md, !hideTopBorder && a.border_t, t.atoms.border_contrast_low, style]}
			>
				{inner}
			</View>
		);
	}
}

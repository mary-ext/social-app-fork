import type { AppBskyUnspeccedDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useIsTrendingEnabled } from '#/state/preferences/trending';
import { type TrendingTopic, useGetTrendsQuery } from '#/state/queries/trending/useGetTrendsQuery';

import { formatCount } from '#/locale/intl/number';

import { AvatarStack } from '#/components/AvatarStack';
import { RichText } from '#/components/RichText';
import { Text } from '#/components/Text';
import { Link } from '#/components/web/Link';
import * as Skeleton from '#/components/web/Skeleton';

import { m } from '#/paraglide/messages';

import * as css from './ExploreTrendingTopics.css';

const TOPIC_COUNT = 5;

export function ExploreTrendingTopics() {
	const trendingEnabled = useIsTrendingEnabled();
	return trendingEnabled ? <Inner /> : null;
}

function Inner() {
	const { data: trending, error, isPending, isRefetching } = useGetTrendsQuery({ limit: TOPIC_COUNT });
	const noTopics = !isPending && !error && !trending?.trends?.length;

	if (isPending || isRefetching) {
		return (
			<>
				{Array.from({ length: TOPIC_COUNT }).map((_, i) => (
					// oxlint-disable-next-line react/no-array-index-key -- static skeleton
					<TrendingTopicRowSkeleton key={i} />
				))}
			</>
		);
	}

	if (error || !trending?.trends || noTopics) {
		return null;
	}

	return (
		<>
			{trending.trends.map((trend, index) => (
				<TrendRow key={trend.link} rank={index + 1} trend={trend} />
			))}
		</>
	);
}

function TrendRow({ rank, trend }: { rank: number; trend: TrendingTopic }) {
	const moderationOpts = useModerationOpts();

	const actors = moderateTrendingActors(trend.actors, moderationOpts);

	return (
		<Link className={css.row} label={trend.label} to={trend.target}>
			<Text className={css.rank} color="textContrastLow" size="md" weight="medium">
				{m['screens.search.trending.rank']({ rank })}
			</Text>
			<div className={css.main}>
				<Text numberOfLines={2} size="md" weight="semiBold">
					{trend.displayName}
				</Text>

				{trend.description && (
					<RichText
						color="textContrastMedium"
						disableLinks
						numberOfLines={2}
						size="md_sub"
						value={trend.description}
					/>
				)}

				<div className={css.metaRow}>
					{actors.length > 0 && <AvatarStack moderationOpts={moderationOpts} profiles={actors} size={20} />}
					<Text color="textContrastMedium" numberOfLines={1} size="md_sub">
						{m['screens.search.trending.postCount']({
							count: trend.postCount,
							formatted: formatCount(trend.postCount),
						})}
					</Text>
				</div>
			</div>
		</Link>
	);
}

function TrendingTopicRowSkeleton() {
	return (
		<div className={css.skeletonRow}>
			<div className={css.rank}>
				<Skeleton.Text size="md" width={12} />
			</div>
			<div className={css.main}>
				<Skeleton.Text size="md" width={140} />
				<Skeleton.Text size="md_sub" />
				<div className={css.metaRow}>
					<AvatarStack moderationOpts={undefined} numPending={3} profiles={[]} size={20} />
					<Skeleton.Text size="md_sub" width={80} />
				</div>
			</div>
		</div>
	);
}

function moderateTrendingActors(
	actors: AppBskyUnspeccedDefs.TrendView['actors'],
	moderationOpts: ModerationOptions | undefined,
) {
	if (!moderationOpts) {
		return [];
	}

	return actors
		.filter((actor) => {
			const decision = moderateProfile(actor, moderationOpts);
			const modui = getDisplayRestrictions(decision, DisplayContext.ProfileMedia);
			return modui.blurs.length === 0 && modui.filters.length === 0;
		})
		.slice(0, 3);
}

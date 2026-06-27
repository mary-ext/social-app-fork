import type { ComponentType } from 'react';
import type { AppBskyUnspeccedDefs } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderateProfile } from '@atcute/bluesky-moderation';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useGetTrendsQuery } from '#/state/queries/trending/useGetTrendsQuery';
import { useTrendingConfig } from '#/state/service-config';
import { useTickEveryMinute } from '#/state/shell';

import type { Props as SVGIconProps } from '#/components/icons/common';
import { Flame_Stroke2_Corner1_Rounded as FlameIcon } from '#/components/icons/Flame';
import { Trending3_Stroke2_Corner1_Rounded as TrendingIcon } from '#/components/icons/Trending';
import { Text } from '#/components/Text';
import { AvatarStack } from '#/components/web/AvatarStack';
import { Link } from '#/components/web/Link';
import * as Skeleton from '#/components/web/Skeleton';

import { m } from '#/paraglide/messages';
import { useTrendingSettings } from '#/storage/hooks/trending';

import * as css from './ExploreTrendingTopics.css';

const TOPIC_COUNT = 5;

export function ExploreTrendingTopics() {
	const { enabled } = useTrendingConfig();
	const { trendingDisabled } = useTrendingSettings();
	return enabled && !trendingDisabled ? <Inner /> : null;
}

function Inner() {
	const { data: trending, error, isLoading, isRefetching } = useGetTrendsQuery();
	const noTopics = !isLoading && !error && !trending?.trends?.length;

	if (isLoading || isRefetching) {
		return (
			<>
				{Array.from({ length: TOPIC_COUNT }).map((_, i) => (
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

function TrendRow({ rank, trend }: { rank: number; trend: AppBskyUnspeccedDefs.TrendView }) {
	const moderationOpts = useModerationOpts();
	// refresh the freshness badge each minute instead of calling Date.now() during render.
	const tick = useTickEveryMinute();

	const category = useCategoryDisplayName(trend?.category || 'other');
	const age = Math.floor((tick - new Date(trend.startedAt || tick).getTime()) / (1000 * 60 * 60));
	const badgeType = trend.status === 'hot' ? 'hot' : age < 2 ? 'new' : age;

	const actors = useModerateTrendingActors(trend.actors);

	return (
		<Link
			className={css.row}
			label={m['screens.search.a11y.browseTopic']({ displayName: trend.displayName })}
			to={trend.link}
		>
			<div className={css.main}>
				<div className={css.titleRow}>
					<Text className={css.rank} size="md" weight="semiBold">
						{m['screens.search.label.rank']({ rank })}
					</Text>
					<Text className={css.nameText} numberOfLines={1} size="md" weight="semiBold">
						{trend.displayName}
					</Text>
				</div>
				<div className={css.metaRow}>
					{actors.length > 0 && <AvatarStack moderationOpts={moderationOpts} profiles={actors} size={20} />}
					<Text color="textContrastMedium" numberOfLines={1} size="md_sub">
						{category}
					</Text>
				</div>
			</div>
			<div className={css.indicator}>
				<TrendingIndicator type={badgeType} />
			</div>
		</Link>
	);
}

function TrendingIndicator({ type }: { type: 'hot' | 'new' | 'skeleton' | number }) {
	if (type === 'skeleton') {
		return <div className={css.pill({ type: 'skeleton' })} />;
	}

	let Icon: ComponentType<SVGIconProps> | null = null;
	let text: string;
	let variant: 'age' | 'hot' | 'new';
	switch (type) {
		case 'hot': {
			Icon = FlameIcon;
			text = m['screens.search.label.hot']();
			variant = 'hot';
			break;
		}
		case 'new': {
			Icon = TrendingIcon;
			text = m['common.label.new']();
			variant = 'new';
			break;
		}
		default: {
			text = m['screens.search.label.timeAgo']({ type });
			variant = 'age';
			break;
		}
	}

	return (
		<div className={css.pill({ type: variant })}>
			{Icon && <Icon fill="currentColor" size="sm" />}
			<Text className={css.pillText} size="sm" weight="medium">
				{text}
			</Text>
		</div>
	);
}

function useCategoryDisplayName(category: AppBskyUnspeccedDefs.TrendView['category']) {
	switch (category) {
		case 'news':
			return m['common.label.news']();
		case 'politics':
			return m['common.label.politics']();
		case 'pop-culture':
			return m['screens.search.label.entertainment']();
		case 'sports':
			return m['common.label.sports']();
		case 'video-games':
			return m['common.label.videoGames']();
		case 'other':
		default:
			return null;
	}
}

function TrendingTopicRowSkeleton() {
	return (
		<div className={css.skeletonRow}>
			<div className={css.main}>
				<div className={css.titleRow}>
					<div className={css.rank}>
						<Skeleton.Text size="md" width={12} />
					</div>
					<Skeleton.Text size="md" width={140} />
				</div>
				<div className={css.metaRow}>
					<AvatarStack moderationOpts={undefined} numPending={3} profiles={[]} size={20} />
					<Skeleton.Text size="md_sub" width={80} />
				</div>
			</div>
			<div className={css.indicator}>
				<TrendingIndicator type="skeleton" />
			</div>
		</div>
	);
}

function useModerateTrendingActors(actors: AppBskyUnspeccedDefs.TrendView['actors']) {
	const moderationOpts = useModerationOpts();

	if (!moderationOpts) return [];

	return actors
		.filter((actor) => {
			const decision = moderateProfile(actor, moderationOpts);
			const modui = getDisplayRestrictions(decision, DisplayContext.ProfileMedia);
			return modui.blurs.length === 0 && modui.filters.length === 0;
		})
		.slice(0, 3);
}

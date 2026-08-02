import type { AppBskyUnspeccedDefs } from '@atcute/bluesky';

import { useLayoutBreakpoints } from '#/lib/hooks/use-breakpoints';

import { setTrendingEnabled, useIsTrendingEnabled } from '#/state/preferences/trending';
import { useGetTrendsQuery } from '#/state/queries/trending/useGetTrendsQuery';

import { Trending3_Stroke2_Corner1_Rounded as TrendingIcon } from '#/components/icons/Trending';
import * as Prompt from '#/components/Prompt';
import { useTopic } from '#/components/trending-topics';
import { Button, ButtonIcon } from '#/components/web/Button';
import { InlineLinkText } from '#/components/web/Link';
import * as Skeleton from '#/components/web/Skeleton';

import XIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './TrendingInterstitial.css';

const SKELETON_WIDTHS = [80, 50, 120, 30, 180];

// the pill row wraps, so it can carry more topics than the sidebar's ranked list. shared by both hooks below
// so they land on one query rather than fetching the same trends twice under different keys.
const TRENDING_LIMIT = 14;

export function useShowTrendingInterstitial({ enabled }: { enabled: boolean }): boolean {
	const trendingEnabled = useIsTrendingEnabled();
	const { rightNavVisible } = useLayoutBreakpoints();

	const eligible = enabled && trendingEnabled && !rightNavVisible;

	const {
		data: trending,
		error,
		isLoading,
	} = useGetTrendsQuery({ enabled: eligible, limit: TRENDING_LIMIT, refetchOnWindowFocus: true });
	const noTopics = !isLoading && !error && !trending?.trends?.length;

	return eligible && !error && !noTopics;
}

export function TrendingInterstitial() {
	const trendingPrompt = Prompt.usePromptHandle();
	const { data: trending, isLoading } = useGetTrendsQuery({
		limit: TRENDING_LIMIT,
		refetchOnWindowFocus: true,
	});

	return (
		<>
			<div className={css.root}>
				<TrendingIcon className={css.icon} size="md" fill={colors.primary_600} />
				{isLoading
					? SKELETON_WIDTHS.map((width, i) => (
							// oxlint-disable-next-line react/no-array-index-key -- static skeleton
							<div key={i} className={css.topic}>
								<Skeleton.Text size="sm" width={width} />
							</div>
						))
					: trending?.trends.map((topic) => <TopicLink key={topic.link} topic={topic} />)}
				{!isLoading && (
					<Button
						variant="ghost"
						size="tiny"
						color="secondary"
						shape="round"
						label={m['components.trendingTopics.a11y.hide']()}
						onClick={() => trendingPrompt.open(null)}
						className={css.hideButton}
					>
						<ButtonIcon icon={XIcon} size="xs" />
					</Button>
				)}
			</div>
			<Prompt.Basic
				handle={trendingPrompt}
				title={m['components.trendingTopics.hide.title']()}
				description={m['components.trendingTopics.hide.message']()}
				confirmButtonCta={m['common.action.hide']()}
				onConfirm={() => setTrendingEnabled(false)}
			/>
		</>
	);
}

function TopicLink({ topic }: { topic: AppBskyUnspeccedDefs.TrendView }) {
	const { label, target } = useTopic(topic);

	if (!target) {
		return null;
	}

	return (
		<InlineLinkText
			to={target}
			label={label}
			size="sm"
			weight="semiBold"
			color="textContrastMedium"
			className={css.topic}
		>
			{topic.displayName}
		</InlineLinkText>
	);
}

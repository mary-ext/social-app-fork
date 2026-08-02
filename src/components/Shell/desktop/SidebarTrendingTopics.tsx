import type { AppBskyUnspeccedDefs } from '@atcute/bluesky';

import { setTrendingEnabled, useIsTrendingEnabled } from '#/state/preferences/trending';
import { useGetTrendsQuery } from '#/state/queries/trending/useGetTrendsQuery';

import { Trending3_Stroke2_Corner1_Rounded as TrendingIcon } from '#/components/icons/Trending';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Text';
import { useTopic } from '#/components/trending-topics';
import { Button, ButtonIcon } from '#/components/web/Button';
import { Link } from '#/components/web/Link';
import * as Skeleton from '#/components/web/Skeleton';

import Ellipsis from '#/icons/central/DotGrid1x3Horizontal_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './SidebarTrendingTopics.css';

const TRENDING_LIMIT = 5;

export function SidebarTrendingTopics() {
	const trendingEnabled = useIsTrendingEnabled();
	return trendingEnabled ? <Inner /> : null;
}

function Inner() {
	const trendingPrompt = Prompt.usePromptHandle();
	const { data: trending, error, isLoading } = useGetTrendsQuery({ refetchOnWindowFocus: true });
	const noTopics = !isLoading && !error && !trending?.trends?.length;

	if (error || noTopics) {
		return null;
	}

	return (
		<>
			<div className={css.card}>
				<div className={css.header}>
					<TrendingIcon size="sm" fill={colors.text} />
					<Text size="md" weight="semiBold" className={css.title}>
						{m['components.trendingTopics.title']()}
					</Text>
					<Button
						variant="ghost"
						size="tiny"
						color="secondary"
						shape="round"
						label={m['components.trendingTopics.a11y.options']()}
						onClick={() => trendingPrompt.open(null)}
						className={css.optionsButton}
					>
						<ButtonIcon icon={Ellipsis} size="xs" />
					</Button>
				</div>

				<div className={css.body}>
					{isLoading
						? Array.from({ length: TRENDING_LIMIT }, (_, i) => (
								<Skeleton.Row key={i} align="center" gap="xs">
									<Text size="sm" className={css.index}>
										{i + 1}.
									</Text>
									<Skeleton.Text size="sm" width={i % 2 === 0 ? 80 : 100} />
								</Skeleton.Row>
							))
						: trending?.trends
								.slice(0, TRENDING_LIMIT)
								.map((topic, i) => <TopicLink key={topic.link} index={i} topic={topic} />)}
				</div>
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

function TopicLink({ index, topic }: { index: number; topic: AppBskyUnspeccedDefs.TrendView }) {
	const { label, target } = useTopic(topic);
	if (!target) {
		return null;
	}
	return (
		<Link to={target} label={label} className={css.topicLink}>
			<Text size="sm" className={css.index}>
				{index + 1}.
			</Text>
			<Text size="sm" className={css.topicName}>
				{topic.displayName}
			</Text>
		</Link>
	);
}

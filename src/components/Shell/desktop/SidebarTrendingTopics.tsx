import { setTrendingEnabled, useIsTrendingEnabled } from '#/state/preferences/trending';
import { type TrendingTopic, useGetTrendsQuery } from '#/state/queries/trending/useGetTrendsQuery';

import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';
import { Link } from '#/components/web/Link';
import * as Skeleton from '#/components/web/Skeleton';

import Ellipsis from '#/icons/central/DotGrid1x3Horizontal_round_outlined_radius1_stroke2.svg';
import TrendingIcon from '#/icons/central/Trending3_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as css from './SidebarTrendingTopics.css';

const TRENDING_LIMIT = 5;

export function SidebarTrendingTopics() {
	const trendingEnabled = useIsTrendingEnabled();
	return trendingEnabled ? <Inner /> : null;
}

function Inner() {
	const trendingPrompt = Prompt.usePromptHandle();
	const { data: trending, error, isPending } = useGetTrendsQuery({ refetchOnWindowFocus: true });
	const noTopics = !isPending && !error && !trending?.trends?.length;

	if (error || noTopics) {
		return null;
	}

	return (
		<>
			<div className={css.card}>
				<div className={css.header}>
					<TrendingIcon className={css.trendingIcon} />
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
					{isPending
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

function TopicLink({ index, topic }: { index: number; topic: TrendingTopic }) {
	return (
		<Link to={topic.target} label={topic.label} className={css.topicLink}>
			<Text size="sm" className={css.index}>
				{index + 1}.
			</Text>
			<Text size="sm" className={css.topicName}>
				{topic.displayName}
			</Text>
		</Link>
	);
}

import { type TrendingTopic, useTrendingTopics } from '#/state/queries/trending/useTrendingTopics';
import { useTrendingConfig } from '#/state/service-config';

import { useLayoutBreakpoints } from '#/alf';

import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Trending3_Stroke2_Corner1_Rounded as TrendingIcon } from '#/components/icons/Trending';
import { useTopic } from '#/components/trending-topics';
import { Button, ButtonIcon } from '#/components/web/Button';
import { InlineLinkText } from '#/components/web/Link';
import * as Prompt from '#/components/web/Prompt';
import * as Skeleton from '#/components/web/Skeleton';

import { m } from '#/paraglide/messages';
import { useTrendingSettings, useTrendingSettingsApi } from '#/storage/hooks/trending';
import { colors } from '#/styles/colors';

import * as css from './trending-interstitial.css';

const SKELETON_WIDTHS = [80, 50, 120, 30, 180];

export function TrendingInterstitial() {
	const { enabled } = useTrendingConfig();
	const { trendingDisabled } = useTrendingSettings();
	const { rightNavVisible } = useLayoutBreakpoints();

	return enabled && !trendingDisabled && !rightNavVisible ? <Inner /> : null;
}

function Inner() {
	const trendingPrompt = Prompt.usePromptHandle();
	const { setTrendingDisabled } = useTrendingSettingsApi();
	const { data: trending, error, isLoading } = useTrendingTopics();
	const noTopics = !isLoading && !error && !trending?.topics?.length;

	const onConfirmHide = () => {
		setTrendingDisabled(true);
	};

	if (error || noTopics) {
		return null;
	}

	return (
		<>
			<div className={css.root}>
				<TrendingIcon className={css.icon} size="md" fill={colors.primary_600} />
				{isLoading
					? SKELETON_WIDTHS.map((width, i) => (
							<div key={i} className={css.topic}>
								<Skeleton.Text size="sm" width={width} />
							</div>
						))
					: trending?.topics?.map((topic) => <TopicLink key={topic.link} topic={topic} />)}
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
				onConfirm={onConfirmHide}
			/>
		</>
	);
}

function TopicLink({ topic }: { topic: TrendingTopic }) {
	const { label, url } = useTopic(topic);

	return (
		<InlineLinkText
			to={url}
			label={label}
			size="sm"
			weight="semiBold"
			color="textContrastMedium"
			className={css.topic}
		>
			{topic.topic}
		</InlineLinkText>
	);
}

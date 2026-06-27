import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { CommonNavigatorParams } from '#/lib/routes/types';

import { usePreferencesQuery, useSetFeedViewPreferencesMutation } from '#/state/queries/preferences';
import {
	normalizeSort,
	normalizeView,
	useThreadPreferences,
} from '#/state/queries/preferences/useThreadPreferences';
import { useTrendingConfig } from '#/state/service-config';

import { Bubbles_Stroke2_Corner2_Rounded as BubblesIcon } from '#/components/icons/Bubble';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { Hashtag_Stroke2_Corner0_Rounded as HashtagIcon } from '#/components/icons/Hashtag';
import { Macintosh_Stroke2_Corner2_Rounded as MacintoshIcon } from '#/components/icons/Macintosh';
import { Play_Stroke2_Corner2_Rounded as PlayIcon } from '#/components/icons/Play';
import { CloseQuote_Stroke2_Corner1_Rounded as QuoteIcon } from '#/components/icons/Quote';
import { Repost_Stroke2_Corner2_Rounded as RepostIcon } from '#/components/icons/Repost';
import { Tree_Stroke2_Corner0_Rounded as TreeIcon } from '#/components/icons/Tree';
import { Trending2_Stroke2_Corner2_Rounded as Graph } from '#/components/icons/Trending';
import * as Settings from '#/components/SettingsCards';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useAutoplayDisabled } from '#/storage/hooks/autoplay';
import { useTrendingSettings, useTrendingSettingsApi } from '#/storage/hooks/trending';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ContentAndMediaSettings'>;
export function ContentAndMediaSettingsScreen({}: Props) {
	const [autoplayDisabledPref, setAutoplayDisabledPref] = useAutoplayDisabled();
	const { enabled: trendingEnabled } = useTrendingConfig();
	const { trendingDisabled } = useTrendingSettings();
	const { setTrendingDisabled } = useTrendingSettingsApi();

	const { sort, setSort, view, setView } = useThreadPreferences({ save: true });

	const { data: preferences } = usePreferencesQuery();
	const { mutate: setFeedViewPref, variables } = useSetFeedViewPreferencesMutation();
	const showReplies = !(variables?.hideReplies ?? preferences?.feedViewPrefs?.hideReplies);
	const showReposts = !(variables?.hideReposts ?? preferences?.feedViewPrefs?.hideReposts);
	const showQuotePosts = !(variables?.hideQuotePosts ?? preferences?.feedViewPrefs?.hideQuotePosts);

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['screens.settings.title.contentMedia']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				<Settings.List>
					<Settings.Section>
						<Settings.LinkRow
							label={m['screens.settings.action.manageSavedFeeds']()}
							to="/settings/saved-feeds"
						>
							<Settings.Icon icon={HashtagIcon} />
							<Settings.Label titleText={m['screens.settings.action.manageSavedFeeds']()} />
						</Settings.LinkRow>
						<Settings.LinkRow label={m['common.label.yourInterests']()} to="/settings/interests">
							<Settings.Icon icon={CircleInfo} />
							<Settings.Label titleText={m['common.label.yourInterests']()} />
						</Settings.LinkRow>
					</Settings.Section>

					<Settings.Section titleText={m['common.label.media']()}>
						<Settings.LinkRow
							label={m['screens.settings.title.externalMedia']()}
							to="/settings/external-embeds"
						>
							<Settings.Icon icon={MacintoshIcon} />
							<Settings.Label titleText={m['screens.settings.title.externalMedia']()} />
						</Settings.LinkRow>
						<Settings.SwitchRow
							label={m['screens.settings.label.autoplay']()}
							onChange={(value) => setAutoplayDisabledPref(!value)}
							value={!autoplayDisabledPref}
						>
							<Settings.Icon icon={PlayIcon} />
							<Settings.Label titleText={m['screens.settings.label.autoplay']()} />
						</Settings.SwitchRow>
						{trendingEnabled && (
							<Settings.SwitchRow
								label={m['screens.settings.label.enableTrendingTopics']()}
								onChange={(value) => setTrendingDisabled(!value)}
								value={!trendingDisabled}
							>
								<Settings.Icon icon={Graph} />
								<Settings.Label titleText={m['screens.settings.label.enableTrendingTopics']()} />
							</Settings.SwitchRow>
						)}
					</Settings.Section>

					<Settings.Section titleText={m['screens.settings.thread.preferencesTitle']()}>
						<Settings.SelectRow
							items={[
								{ label: m['common.label.topRepliesFirst'](), value: 'top' },
								{ label: m['common.label.oldestRepliesFirst'](), value: 'oldest' },
								{ label: m['common.label.newestRepliesFirst'](), value: 'newest' },
							]}
							label={m['screens.settings.thread.sortReplies']()}
							onValueChange={(value) => setSort(normalizeSort(value))}
							value={sort}
						>
							<Settings.Icon icon={BubblesIcon} />
							<Settings.Label titleText={m['screens.settings.thread.sortReplies']()} />
						</Settings.SelectRow>
						<Settings.SwitchRow
							label={m['screens.settings.thread.treeView']()}
							onChange={(value) => setView(normalizeView({ treeViewEnabled: value }))}
							value={view === 'tree'}
						>
							<Settings.Icon icon={TreeIcon} />
							<Settings.Label
								subtitleText={m['screens.settings.thread.showThreadedView']()}
								titleText={m['screens.settings.thread.treeView']()}
							/>
						</Settings.SwitchRow>
					</Settings.Section>

					<Settings.Section
						footnoteText={m['screens.settings.thread.followingOnlyHint']()}
						titleText={m['screens.settings.label.followingFeed']()}
					>
						<Settings.SwitchRow
							label={m['screens.settings.thread.showReplies']()}
							onChange={(value) => setFeedViewPref({ hideReplies: !value })}
							value={showReplies}
						>
							<Settings.Icon icon={BubblesIcon} />
							<Settings.Label titleText={m['screens.settings.thread.showReplies']()} />
						</Settings.SwitchRow>
						<Settings.SwitchRow
							label={m['screens.settings.thread.showReposts']()}
							onChange={(value) => setFeedViewPref({ hideReposts: !value })}
							value={showReposts}
						>
							<Settings.Icon icon={RepostIcon} />
							<Settings.Label titleText={m['screens.settings.thread.showReposts']()} />
						</Settings.SwitchRow>
						<Settings.SwitchRow
							label={m['screens.settings.thread.showQuotes']()}
							onChange={(value) => setFeedViewPref({ hideQuotePosts: !value })}
							value={showQuotePosts}
						>
							<Settings.Icon icon={QuoteIcon} />
							<Settings.Label titleText={m['screens.settings.thread.showQuotes']()} />
						</Settings.SwitchRow>
					</Settings.Section>
				</Settings.List>
			</Layout.Content>
		</Layout.Screen>
	);
}

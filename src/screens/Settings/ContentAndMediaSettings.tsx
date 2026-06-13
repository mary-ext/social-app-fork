import { Trans, useLingui } from '@lingui/react/macro';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { CommonNavigatorParams } from '#/lib/routes/types';

import { usePreferencesQuery, useSetFeedViewPreferencesMutation } from '#/state/queries/preferences';
import {
	normalizeSort,
	normalizeView,
	useThreadPreferences,
} from '#/state/queries/preferences/useThreadPreferences';
import { useTrendingConfig } from '#/state/service-config';

import { Beaker_Stroke2_Corner2_Rounded as BeakerIcon } from '#/components/icons/Beaker';
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

import { useAutoplayDisabled } from '#/storage/hooks/autoplay';
import { useTrendingSettings, useTrendingSettingsApi } from '#/storage/hooks/trending';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ContentAndMediaSettings'>;
export function ContentAndMediaSettingsScreen({}: Props) {
	const { t: l } = useLingui();

	const [autoplayDisabledPref, setAutoplayDisabledPref] = useAutoplayDisabled();
	const { enabled: trendingEnabled } = useTrendingConfig();
	const { trendingDisabled, trendingVideoDisabled } = useTrendingSettings();
	const { setTrendingDisabled, setTrendingVideoDisabled } = useTrendingSettingsApi();

	const { sort, setSort, view, setView } = useThreadPreferences({ save: true });

	const { data: preferences } = usePreferencesQuery();
	const { mutate: setFeedViewPref, variables } = useSetFeedViewPreferencesMutation();
	const showReplies = !(variables?.hideReplies ?? preferences?.feedViewPrefs?.hideReplies);
	const showReposts = !(variables?.hideReposts ?? preferences?.feedViewPrefs?.hideReposts);
	const showQuotePosts = !(variables?.hideQuotePosts ?? preferences?.feedViewPrefs?.hideQuotePosts);
	const mergeFeedEnabled = Boolean(
		variables?.lab_mergeFeedEnabled ?? preferences?.feedViewPrefs?.lab_mergeFeedEnabled,
	);

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>
						<Trans>Content & Media</Trans>
					</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				<Settings.List>
					<Settings.Section>
						<Settings.LinkRow label={l`Manage saved feeds`} to="/settings/saved-feeds">
							<Settings.Icon icon={HashtagIcon} />
							<Settings.Label titleText={<Trans>Manage saved feeds</Trans>} />
						</Settings.LinkRow>
						<Settings.LinkRow label={l`External media`} to="/settings/external-embeds">
							<Settings.Icon icon={MacintoshIcon} />
							<Settings.Label titleText={<Trans>External media</Trans>} />
						</Settings.LinkRow>
						<Settings.LinkRow label={l`Your interests`} to="/settings/interests">
							<Settings.Icon icon={CircleInfo} />
							<Settings.Label titleText={<Trans>Your interests</Trans>} />
						</Settings.LinkRow>
					</Settings.Section>

					<Settings.Section titleText={<Trans>Media</Trans>}>
						<Settings.SwitchRow
							label={l`Autoplay videos and GIFs`}
							onChange={(value) => setAutoplayDisabledPref(!value)}
							value={!autoplayDisabledPref}
						>
							<Settings.Icon icon={PlayIcon} />
							<Settings.Label titleText={<Trans>Autoplay videos and GIFs</Trans>} />
						</Settings.SwitchRow>
						{trendingEnabled && (
							<Settings.SwitchRow
								label={l`Enable trending topics`}
								onChange={(value) => setTrendingDisabled(!value)}
								value={!trendingDisabled}
							>
								<Settings.Icon icon={Graph} />
								<Settings.Label titleText={<Trans>Enable trending topics</Trans>} />
							</Settings.SwitchRow>
						)}
						{trendingEnabled && (
							<Settings.SwitchRow
								label={l`Enable trending videos in your Discover feed`}
								onChange={(value) => setTrendingVideoDisabled(!value)}
								value={!trendingVideoDisabled}
							>
								<Settings.Icon icon={Graph} />
								<Settings.Label titleText={<Trans>Enable trending videos in your Discover feed</Trans>} />
							</Settings.SwitchRow>
						)}
					</Settings.Section>

					<Settings.Section titleText={<Trans>Thread preferences</Trans>}>
						<Settings.SelectRow
							items={[
								{ label: l`Top replies first`, value: 'top' },
								{ label: l`Oldest replies first`, value: 'oldest' },
								{ label: l`Newest replies first`, value: 'newest' },
							]}
							label={l`Sort replies`}
							onValueChange={(value) => setSort(normalizeSort(value))}
							value={sort}
						>
							<Settings.Icon icon={BubblesIcon} />
							<Settings.Label titleText={<Trans>Sort replies</Trans>} />
						</Settings.SelectRow>
						<Settings.SwitchRow
							label={l`Tree view`}
							onChange={(value) => setView(normalizeView({ treeViewEnabled: value }))}
							value={view === 'tree'}
						>
							<Settings.Icon icon={TreeIcon} />
							<Settings.Label
								subtitleText={<Trans>Show post replies in a threaded tree view</Trans>}
								titleText={<Trans>Tree view</Trans>}
							/>
						</Settings.SwitchRow>
					</Settings.Section>

					<Settings.Section
						footnoteText={<Trans>These settings only apply to the Following feed.</Trans>}
						titleText={<Trans>Following feed</Trans>}
					>
						<Settings.SwitchRow
							label={l`Show replies`}
							onChange={(value) => setFeedViewPref({ hideReplies: !value })}
							value={showReplies}
						>
							<Settings.Icon icon={BubblesIcon} />
							<Settings.Label titleText={<Trans>Show replies</Trans>} />
						</Settings.SwitchRow>
						<Settings.SwitchRow
							label={l`Show reposts`}
							onChange={(value) => setFeedViewPref({ hideReposts: !value })}
							value={showReposts}
						>
							<Settings.Icon icon={RepostIcon} />
							<Settings.Label titleText={<Trans>Show reposts</Trans>} />
						</Settings.SwitchRow>
						<Settings.SwitchRow
							label={l`Show quote posts`}
							onChange={(value) => setFeedViewPref({ hideQuotePosts: !value })}
							value={showQuotePosts}
						>
							<Settings.Icon icon={QuoteIcon} />
							<Settings.Label titleText={<Trans>Show quote posts</Trans>} />
						</Settings.SwitchRow>
						<Settings.SwitchRow
							label={l`Show samples of your saved feeds in your Following feed`}
							onChange={(value) => setFeedViewPref({ lab_mergeFeedEnabled: value })}
							value={mergeFeedEnabled}
						>
							<Settings.Icon icon={BeakerIcon} />
							<Settings.Label
								subtitleText={<Trans>Show samples of your saved feeds in your Following feed</Trans>}
								titleText={<Trans>Merge saved feeds</Trans>}
							/>
						</Settings.SwitchRow>
					</Settings.Section>
				</Settings.List>
			</Layout.Content>
		</Layout.Screen>
	);
}

import { setAutoplayDisabled, useAutoplayDisabled } from '#/state/preferences/autoplay';
import { setTrendingEnabled, useIsTrendingEnabled } from '#/state/preferences/trending';
import { usePreferencesQuery, useSetFeedViewPreferencesMutation } from '#/state/queries/preferences';
import {
	normalizeSort,
	normalizeView,
	useThreadPreferences,
} from '#/state/queries/preferences/useThreadPreferences';
import { useTitle } from '#/state/use-title';

import * as Settings from '#/components/SettingsCards';
import * as Layout from '#/components/web/Layout';

import RepostIcon from '#/icons/central/ArrowsRepeatRightLeft_round_outlined_radius1_stroke2.svg';
import BubblesIcon from '#/icons/central/Bubbles_round_outlined_radius1_stroke2.svg';
import CircleInfo from '#/icons/central/CircleInfo_round_outlined_radius1_stroke2.svg';
import QuoteIcon from '#/icons/central/CloseQuote2_round_outlined_radius1_stroke2.svg';
import TreeIcon from '#/icons/central/CodeTree_round_outlined_radius1_stroke2.svg';
import HashtagIcon from '#/icons/central/Hashtag_round_outlined_radius1_stroke2.svg';
import MacintoshIcon from '#/icons/central/Macintosh_round_outlined_radius1_stroke2.svg';
import PlayIcon from '#/icons/central/Play_round_outlined_radius1_stroke2.svg';
import Graph from '#/icons/central/Trending2_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

export function ContentAndMediaSettingsScreen() {
	useTitle(m['navigation.settings.contentAndMedia.title']());

	const autoplayDisabledPref = useAutoplayDisabled();
	const trendingEnabled = useIsTrendingEnabled();

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
					<Layout.Header.TitleText>{m['screens.settings.media.sectionTitle']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<Layout.Content>
				<Settings.List>
					<Settings.Section>
						<Settings.LinkRow label={m['screens.settings.feeds.manageSaved']()} to={{ name: 'SavedFeeds' }}>
							<Settings.Icon icon={HashtagIcon} />
							<Settings.Label titleText={m['screens.settings.feeds.manageSaved']()} />
						</Settings.LinkRow>
						<Settings.LinkRow label={m['common.interest.yourInterests']()} to={{ name: 'InterestsSettings' }}>
							<Settings.Icon icon={CircleInfo} />
							<Settings.Label titleText={m['common.interest.yourInterests']()} />
						</Settings.LinkRow>
					</Settings.Section>

					<Settings.Section titleText={m['common.media.label']()}>
						<Settings.LinkRow
							label={m['screens.settings.media.externalTitle']()}
							to={{ name: 'PreferencesExternalEmbeds' }}
						>
							<Settings.Icon icon={MacintoshIcon} />
							<Settings.Label titleText={m['screens.settings.media.externalTitle']()} />
						</Settings.LinkRow>
						<Settings.SwitchRow
							label={m['screens.settings.media.autoplay']()}
							onChange={(value) => setAutoplayDisabled(!value)}
							value={!autoplayDisabledPref}
						>
							<Settings.Icon icon={PlayIcon} />
							<Settings.Label titleText={m['screens.settings.media.autoplay']()} />
						</Settings.SwitchRow>
						<Settings.SwitchRow
							label={m['screens.settings.media.trending']()}
							onChange={setTrendingEnabled}
							value={trendingEnabled}
						>
							<Settings.Icon icon={Graph} />
							<Settings.Label titleText={m['screens.settings.media.trending']()} />
						</Settings.SwitchRow>
					</Settings.Section>

					<Settings.Section titleText={m['screens.settings.thread.title']()}>
						<Settings.SelectRow
							items={[
								{ label: m['common.thread.sort.top'](), value: 'top' },
								{ label: m['common.thread.sort.oldest'](), value: 'oldest' },
								{ label: m['common.thread.sort.newest'](), value: 'newest' },
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
						titleText={m['screens.settings.feeds.following']()}
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

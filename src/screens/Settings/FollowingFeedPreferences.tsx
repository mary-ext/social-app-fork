import { Trans, useLingui } from '@lingui/react/macro';

import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';

import { usePreferencesQuery, useSetFeedViewPreferencesMutation } from '#/state/queries/preferences';

import { Beaker_Stroke2_Corner2_Rounded as BeakerIcon } from '#/components/icons/Beaker';
import { Bubbles_Stroke2_Corner2_Rounded as BubblesIcon } from '#/components/icons/Bubble';
import { CloseQuote_Stroke2_Corner1_Rounded as QuoteIcon } from '#/components/icons/Quote';
import { Repost_Stroke2_Corner2_Rounded as RepostIcon } from '#/components/icons/Repost';
import { Admonition } from '#/components/web/Admonition';
import * as Layout from '#/components/web/Layout';
import * as SettingsList from '#/components/web/SettingsList';

import { sprinkles } from '#/styles/sprinkles.css';

const bodyClass = sprinkles({ display: 'flex', flexDirection: 'column', gap: 'sm', width: 'full' });
const headerRowClass = sprinkles({ alignItems: 'center', display: 'flex', flexDirection: 'row', gap: 'sm' });
const insetClass = sprinkles({ paddingLeft: '_4xl' });

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PreferencesFollowingFeed'>;
export function FollowingFeedPreferencesScreen({}: Props) {
	const { t: l } = useLingui();
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
						<Trans>Following Feed Preferences</Trans>
					</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				<SettingsList.Container>
					<SettingsList.Item>
						<Admonition type="tip">
							<Trans>These settings only apply to the Following feed.</Trans>
						</Admonition>
					</SettingsList.Item>
					<SettingsList.CheckboxItem
						label={l`Show replies`}
						value={showReplies}
						onChange={(value) => setFeedViewPref({ hideReplies: !value })}
					>
						<SettingsList.ItemIcon icon={BubblesIcon} />
						<SettingsList.ItemText>
							<Trans>Show replies</Trans>
						</SettingsList.ItemText>
						<SettingsList.CheckboxBox />
					</SettingsList.CheckboxItem>
					<SettingsList.CheckboxItem
						label={l`Show reposts`}
						value={showReposts}
						onChange={(value) => setFeedViewPref({ hideReposts: !value })}
					>
						<SettingsList.ItemIcon icon={RepostIcon} />
						<SettingsList.ItemText>
							<Trans>Show reposts</Trans>
						</SettingsList.ItemText>
						<SettingsList.CheckboxBox />
					</SettingsList.CheckboxItem>
					<SettingsList.CheckboxItem
						label={l`Show quote posts`}
						value={showQuotePosts}
						onChange={(value) => setFeedViewPref({ hideQuotePosts: !value })}
					>
						<SettingsList.ItemIcon icon={QuoteIcon} />
						<SettingsList.ItemText>
							<Trans>Show quote posts</Trans>
						</SettingsList.ItemText>
						<SettingsList.CheckboxBox />
					</SettingsList.CheckboxItem>
					<SettingsList.Divider />
					<SettingsList.Group>
						<div className={bodyClass}>
							<div className={headerRowClass}>
								<SettingsList.ItemIcon icon={BeakerIcon} />
								<SettingsList.ItemText>
									<Trans>Experimental</Trans>
								</SettingsList.ItemText>
							</div>
							<div className={insetClass}>
								<SettingsList.CheckboxItem
									flush
									label={l`Show samples of your saved feeds in your Following feed`}
									value={mergeFeedEnabled}
									onChange={(value) => setFeedViewPref({ lab_mergeFeedEnabled: value })}
								>
									<SettingsList.LabelText>
										<Trans>Show samples of your saved feeds in your Following feed</Trans>
									</SettingsList.LabelText>
									<SettingsList.CheckboxBox />
								</SettingsList.CheckboxItem>
							</div>
						</div>
					</SettingsList.Group>
				</SettingsList.Container>
			</Layout.Content>
		</Layout.Screen>
	);
}

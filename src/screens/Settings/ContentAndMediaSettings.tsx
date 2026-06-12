import { Trans, useLingui } from '@lingui/react/macro';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { CommonNavigatorParams } from '#/lib/routes/types';

import { useTrendingConfig } from '#/state/service-config';

import { Bubbles_Stroke2_Corner2_Rounded as BubblesIcon } from '#/components/icons/Bubble';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { Hashtag_Stroke2_Corner0_Rounded as HashtagIcon } from '#/components/icons/Hashtag';
import { Home_Stroke2_Corner2_Rounded as HomeIcon } from '#/components/icons/Home';
import { Macintosh_Stroke2_Corner2_Rounded as MacintoshIcon } from '#/components/icons/Macintosh';
import { Play_Stroke2_Corner2_Rounded as PlayIcon } from '#/components/icons/Play';
import { Trending2_Stroke2_Corner2_Rounded as Graph } from '#/components/icons/Trending';
import * as SettingsList from '#/components/SettingsList';
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
				<SettingsList.Container>
					<SettingsList.LinkItem to="/settings/saved-feeds" label={l`Manage saved feeds`}>
						<SettingsList.ItemIcon icon={HashtagIcon} />
						<SettingsList.ItemText>
							<Trans>Manage saved feeds</Trans>
						</SettingsList.ItemText>
					</SettingsList.LinkItem>
					<SettingsList.LinkItem to="/settings/threads" label={l`Thread preferences`}>
						<SettingsList.ItemIcon icon={BubblesIcon} />
						<SettingsList.ItemText>
							<Trans>Thread preferences</Trans>
						</SettingsList.ItemText>
					</SettingsList.LinkItem>
					<SettingsList.LinkItem to="/settings/following-feed" label={l`Following feed preferences`}>
						<SettingsList.ItemIcon icon={HomeIcon} />
						<SettingsList.ItemText>
							<Trans>Following feed preferences</Trans>
						</SettingsList.ItemText>
					</SettingsList.LinkItem>
					<SettingsList.LinkItem to="/settings/external-embeds" label={l`External media`}>
						<SettingsList.ItemIcon icon={MacintoshIcon} />
						<SettingsList.ItemText>
							<Trans>External media</Trans>
						</SettingsList.ItemText>
					</SettingsList.LinkItem>
					<SettingsList.LinkItem to="/settings/interests" label={l`Your interests`}>
						<SettingsList.ItemIcon icon={CircleInfo} />
						<SettingsList.ItemText>
							<Trans>Your interests</Trans>
						</SettingsList.ItemText>
					</SettingsList.LinkItem>
					<SettingsList.Divider />
					<SettingsList.CheckboxItem
						label={l`Autoplay videos and GIFs`}
						value={!autoplayDisabledPref}
						onChange={(value) => setAutoplayDisabledPref(!value)}
					>
						<SettingsList.ItemIcon icon={PlayIcon} />
						<SettingsList.ItemText>
							<Trans>Autoplay videos and GIFs</Trans>
						</SettingsList.ItemText>
						<SettingsList.CheckboxBox />
					</SettingsList.CheckboxItem>
					{trendingEnabled && (
						<>
							<SettingsList.Divider />
							<SettingsList.CheckboxItem
								label={l`Enable trending topics`}
								value={!trendingDisabled}
								onChange={(value) => setTrendingDisabled(!value)}
							>
								<SettingsList.ItemIcon icon={Graph} />
								<SettingsList.ItemText>
									<Trans>Enable trending topics</Trans>
								</SettingsList.ItemText>
								<SettingsList.CheckboxBox />
							</SettingsList.CheckboxItem>
							<SettingsList.CheckboxItem
								label={l`Enable trending videos in your Discover feed`}
								value={!trendingVideoDisabled}
								onChange={(value) => setTrendingVideoDisabled(!value)}
							>
								<SettingsList.ItemIcon icon={Graph} />
								<SettingsList.ItemText>
									<Trans>Enable trending videos in your Discover feed</Trans>
								</SettingsList.ItemText>
								<SettingsList.CheckboxBox />
							</SettingsList.CheckboxItem>
						</>
					)}
				</SettingsList.Container>
			</Layout.Content>
		</Layout.Screen>
	);
}

import type { AppBskyNotificationDeclaration } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { CommonNavigatorParams } from '#/lib/routes/types';

import { useNotificationDeclarationQuery } from '#/state/queries/activity-subscriptions';

import { BellRinging_Stroke2_Corner0_Rounded as BellRingingIcon } from '#/components/icons/BellRinging';
import { EyeSlash_Stroke2_Corner0_Rounded as EyeSlashIcon } from '#/components/icons/EyeSlash';
import * as SettingsList from '#/components/SettingsList';
import { Admonition } from '#/components/web/Admonition';
import * as Layout from '#/components/web/Layout';
import { InlineLinkText } from '#/components/web/Link';

import { PwiOptOut } from './components/PwiOptOut';
import { ItemTextWithSubtitle } from './NotificationSettings/components/ItemTextWithSubtitle';
import * as styles from './PrivacyAndSecuritySettings.css';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PrivacyAndSecuritySettings'>;
export function PrivacyAndSecuritySettingsScreen({}: Props) {
	const { t: l } = useLingui();
	const { data: notificationDeclaration, isError, isPending } = useNotificationDeclarationQuery();

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>
						<Trans>Privacy and Security</Trans>
					</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<Layout.Content>
				<SettingsList.Container>
					<SettingsList.LinkItem
						align="start"
						label={l`Settings for allowing others to be notified of your posts`}
						to={{ screen: 'ActivityPrivacySettings' }}
					>
						<SettingsList.ItemIcon icon={BellRingingIcon} />
						<ItemTextWithSubtitle
							showSkeleton={isPending}
							subtitleText={<NotificationDeclaration data={notificationDeclaration} isError={isError} />}
							titleText={<Trans>Allow others to be notified of your posts</Trans>}
						/>
					</SettingsList.LinkItem>
					<SettingsList.Divider />
					<SettingsList.Group>
						<div className={styles.headerRow}>
							<SettingsList.ItemIcon icon={EyeSlashIcon} />
							<SettingsList.ItemText>
								<Trans>Logged-out visibility</Trans>
							</SettingsList.ItemText>
						</div>
						<div className={styles.insetColumn}>
							<PwiOptOut />
						</div>
					</SettingsList.Group>
					<SettingsList.Item>
						<Admonition type="tip">
							<Trans>
								Note: Bluesky is an open and public network. This setting only limits the visibility of your
								content on the Bluesky app and website, and other apps may not respect this setting. Your
								content may still be shown to logged-out users by other apps and websites.
							</Trans>{' '}
							<InlineLinkText
								label={l`Learn more about what is public on Bluesky.`}
								to="https://blueskyweb.zendesk.com/hc/en-us/articles/15835264007693-Data-Privacy"
							>
								<Trans>Learn more about what is public on Bluesky.</Trans>
							</InlineLinkText>
						</Admonition>
					</SettingsList.Item>
				</SettingsList.Container>
			</Layout.Content>
		</Layout.Screen>
	);
}

function NotificationDeclaration({
	data,
	isError,
}: {
	data?: {
		value: AppBskyNotificationDeclaration.Main;
	};
	isError?: boolean;
}) {
	if (isError) {
		return <Trans>Error loading preference</Trans>;
	}
	switch (data?.value?.allowSubscriptions) {
		case 'mutuals':
			return <Trans>Only followers who I follow</Trans>;
		case 'none':
			return <Trans context="enable for">No one</Trans>;
		case 'followers':
		default:
			return <Trans>Anyone who follows me</Trans>;
	}
}

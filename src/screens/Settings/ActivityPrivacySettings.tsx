import type { AppBskyNotificationDeclaration } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';

import type { AllNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';

import {
	useNotificationDeclarationMutation,
	useNotificationDeclarationQuery,
} from '#/state/queries/activity-subscriptions';

import { BellRinging_Stroke2_Corner0_Rounded as BellRingingIcon } from '#/components/icons/BellRinging';
import * as SettingsList from '#/components/SettingsList';
import { Spinner } from '#/components/Spinner';
import { Admonition } from '#/components/web/Admonition';
import * as Toggle from '#/components/web/forms/Toggle';
import * as Layout from '#/components/web/Layout';

import * as styles from './ActivityPrivacySettings.css';
import { ItemTextWithSubtitle } from './NotificationSettings/components/ItemTextWithSubtitle';

type Props = NativeStackScreenProps<AllNavigatorParams, 'ActivityPrivacySettings'>;
export function ActivityPrivacySettingsScreen({}: Props) {
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
					<SettingsList.Item align="start">
						<SettingsList.ItemIcon icon={BellRingingIcon} />
						<ItemTextWithSubtitle
							bold
							subtitleText={
								<Trans>
									This feature allows users to receive notifications for your new posts and replies. Who do
									you want to enable this for?
								</Trans>
							}
							titleText={<Trans>Allow others to be notified of your posts</Trans>}
						/>
					</SettingsList.Item>
					<div className={styles.body}>
						{isError ? (
							<Admonition type="error">
								<Trans>Failed to load preference.</Trans>
							</Admonition>
						) : isPending ? (
							<div className={styles.loaderWrap}>
								<Spinner color="currentColor" label={l`Loading`} size="xl" />
							</div>
						) : (
							<Inner notificationDeclaration={notificationDeclaration} />
						)}
					</div>
				</SettingsList.Container>
			</Layout.Content>
		</Layout.Screen>
	);
}

export function Inner({
	notificationDeclaration,
}: {
	notificationDeclaration: {
		cid?: string;
		uri?: string;
		value: AppBskyNotificationDeclaration.Main;
	};
}) {
	const { t: l } = useLingui();
	const { mutate } = useNotificationDeclarationMutation();

	const onChangeFilter = ([declaration]: string[]) => {
		mutate({
			$type: 'app.bsky.notification.declaration',
			allowSubscriptions: declaration!,
		});
	};

	return (
		<Toggle.Group
			className={styles.radioList}
			label={l`Filter who can opt to receive notifications for your activity`}
			onChange={onChangeFilter}
			type="radio"
			values={[notificationDeclaration.value.allowSubscriptions]}
		>
			<Toggle.RadioItem label={l`Anyone who follows me`} value="followers">
				<Toggle.Panel>
					<Toggle.RadioIndicator />
					<Toggle.PanelText>
						<Trans>Anyone who follows me</Trans>
					</Toggle.PanelText>
				</Toggle.Panel>
			</Toggle.RadioItem>
			<Toggle.RadioItem label={l`Only followers who I follow`} value="mutuals">
				<Toggle.Panel>
					<Toggle.RadioIndicator />
					<Toggle.PanelText>
						<Trans>Only followers who I follow</Trans>
					</Toggle.PanelText>
				</Toggle.Panel>
			</Toggle.RadioItem>
			<Toggle.RadioItem label={l({ context: 'enable for', message: `No one` })} value="none">
				<Toggle.Panel>
					<Toggle.RadioIndicator />
					<Toggle.PanelText>
						<Trans context="enable for">No one</Trans>
					</Toggle.PanelText>
				</Toggle.Panel>
			</Toggle.RadioItem>
		</Toggle.Group>
	);
}

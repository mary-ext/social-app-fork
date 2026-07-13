import type { ReactNode } from 'react';

import {
	isChatPreferenceName,
	type NotificationSettingsPreferenceName,
	useChatNotificationSettingsQuery,
	useNotificationSettingsQuery,
} from '#/state/queries/notifications/settings';

import { PreferenceControls } from '#/screens/Settings/NotificationSettings/components/PreferenceControls';

import * as Dialog from '#/components/Dialog';
import { Stack } from '#/components/Stack';
import { Text } from '#/components/Text';
import { Admonition } from '#/components/web/Admonition';

import { m } from '#/paraglide/messages';

import * as styles from './NotificationSettingsDialog.css';

type NotificationSettingsDialogProps = {
	allowDisableInApp?: boolean;
	handle: Dialog.DialogHandle;
	name: NotificationSettingsPreferenceName;
	subtitleText: ReactNode;
	syncOthers?: NotificationSettingsPreferenceName[];
	titleText: ReactNode;
};

export function NotificationSettingsDialog({
	allowDisableInApp = true,
	handle,
	name,
	subtitleText,
	syncOthers,
	titleText,
}: NotificationSettingsDialogProps) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup size="narrow">
				<Inner
					allowDisableInApp={allowDisableInApp}
					name={name}
					subtitleText={subtitleText}
					syncOthers={syncOthers}
					titleText={titleText}
				/>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function Inner({
	allowDisableInApp,
	name,
	subtitleText,
	syncOthers,
	titleText,
}: Omit<NotificationSettingsDialogProps, 'handle'>) {
	const isChat = isChatPreferenceName(name);
	const appQuery = useNotificationSettingsQuery({ enabled: !isChat });
	const chatQuery = useChatNotificationSettingsQuery({ enabled: isChat });
	const isError = isChat ? chatQuery.isError : appQuery.isError;
	const preference = isChat ? chatQuery.data?.[name] : appQuery.data?.[name];

	return (
		<Stack gap="lg">
			<Stack gap="xs">
				<Dialog.TitleRow>
					<Dialog.Title>{titleText}</Dialog.Title>
					<Dialog.Close />
				</Dialog.TitleRow>

				<Text color="textContrastMedium" size="md">
					{subtitleText}
				</Text>
			</Stack>

			{isError ? (
				<div className={styles.errorWrap}>
					<Admonition type="error">{m['common.notifications.loadSettingsError']()}</Admonition>
				</div>
			) : (
				<PreferenceControls
					allowDisableInApp={allowDisableInApp}
					name={name}
					preference={preference}
					syncOthers={syncOthers}
				/>
			)}
		</Stack>
	);
}
